package com.healthtrack.app

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.metadata.Metadata as HealthMetadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Instrumented tests for the Health Connect integration.
 *
 * These tests run on the Samsung A56 emulator (API 35, google_apis) and verify
 * that the app can:
 *   1. Detect that Health Connect is available
 *   2. Write synthetic health data (steps, heart rate, sleep)
 *   3. Read it back via the Health Connect client
 *
 * Permissions are pre-granted via ADB in the CI workflow:
 *   adb shell pm grant com.healthtrack.app android.permission.health.READ_STEPS
 *   adb shell pm grant com.healthtrack.app android.permission.health.WRITE_STEPS
 *   ... (etc.)
 *
 * The tests skip gracefully when Health Connect is unavailable (e.g. on old API images).
 */
@RunWith(AndroidJUnit4::class)
class HealthConnectTest {

    private lateinit var context: Context
    private lateinit var client: HealthConnectClient

    companion object {
        /** Test time anchor — 2 hours in the past, so data is clearly historical. */
        private val TEST_START: Instant = Instant.now().minus(2, ChronoUnit.HOURS)
        private val TEST_END: Instant = Instant.now().minus(1, ChronoUnit.HOURS)
    }

    @Before
    fun setUp() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("com.healthtrack.app", context.packageName)

        // Skip the whole test class if Health Connect is unavailable on this device/emulator
        val status = HealthConnectClient.getSdkStatus(context)
        assumeTrue(
            "Health Connect SDK not available (status=$status) — skipping tests",
            status == HealthConnectClient.SDK_AVAILABLE
        )
        client = HealthConnectClient.getOrCreate(context)
    }

    // ── Availability ──────────────────────────────────────────────────────────

    @Test
    fun healthConnect_isAvailableOnEmulator() {
        val status = HealthConnectClient.getSdkStatus(context)
        assertEquals(
            "Health Connect doit être disponible sur l'émulateur Google APIs API 35",
            HealthConnectClient.SDK_AVAILABLE,
            status
        )
    }

    // ── Steps ─────────────────────────────────────────────────────────────────

    @Test
    fun healthConnect_canWriteAndReadSteps() = runBlocking {
        val stepsRecord = StepsRecord(
            startTime = TEST_START,
            endTime = TEST_END,
            startZoneOffset = null,
            endZoneOffset = null,
            count = 4_200,
            metadata = HealthMetadata(),
        )
        client.insertRecords(listOf(stepsRecord))

        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(
                    TEST_START.minus(1, ChronoUnit.MINUTES),
                    TEST_END.plus(1, ChronoUnit.MINUTES)
                ),
            )
        )
        assertTrue(
            "Au moins un enregistrement de pas doit être présent",
            response.records.isNotEmpty()
        )
        val insertedRecord = response.records.first()
        assertEquals("Le nombre de pas doit être 4200", 4_200L, insertedRecord.count)
    }

    // ── Heart rate ────────────────────────────────────────────────────────────

    @Test
    fun healthConnect_canWriteAndReadHeartRate() = runBlocking {
        val hrSample = HeartRateRecord.Sample(
            time = TEST_START.plus(5, ChronoUnit.MINUTES),
            beatsPerMinute = 72,
        )
        val hrRecord = HeartRateRecord(
            startTime = TEST_START,
            endTime = TEST_END,
            startZoneOffset = null,
            endZoneOffset = null,
            samples = listOf(hrSample),
            metadata = HealthMetadata(),
        )
        client.insertRecords(listOf(hrRecord))

        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = TimeRangeFilter.between(
                    TEST_START.minus(1, ChronoUnit.MINUTES),
                    TEST_END.plus(1, ChronoUnit.MINUTES)
                ),
            )
        )
        assertTrue(
            "Au moins un enregistrement de fréquence cardiaque doit être présent",
            response.records.isNotEmpty()
        )
        val inserted = response.records.first()
        assertTrue("L'enregistrement doit contenir des samples", inserted.samples.isNotEmpty())
        assertEquals("La fréquence cardiaque doit être 72 bpm", 72L, inserted.samples.first().beatsPerMinute)
    }

    // ── Sleep ─────────────────────────────────────────────────────────────────

    @Test
    fun healthConnect_canWriteAndReadSleep() = runBlocking {
        val sleepStart = TEST_START.minus(8, ChronoUnit.HOURS)
        val sleepEnd = TEST_START.minus(30, ChronoUnit.MINUTES)

        val sleepRecord = SleepSessionRecord(
            startTime = sleepStart,
            endTime = sleepEnd,
            startZoneOffset = null,
            endZoneOffset = null,
            title = "Nuit de test",
            stages = listOf(
                SleepSessionRecord.Stage(
                    startTime = sleepStart,
                    endTime = sleepEnd,
                    stage = SleepSessionRecord.STAGE_TYPE_SLEEPING,
                )
            ),
            metadata = HealthMetadata(),
        )
        client.insertRecords(listOf(sleepRecord))

        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = SleepSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(
                    sleepStart.minus(1, ChronoUnit.MINUTES),
                    sleepEnd.plus(1, ChronoUnit.MINUTES)
                ),
            )
        )
        assertTrue(
            "Au moins un enregistrement de sommeil doit être présent",
            response.records.isNotEmpty()
        )
        val inserted = response.records.first()
        assertNotEquals("La durée de sommeil ne doit pas être nulle", sleepStart, inserted.endTime)
    }

    // ── Full connector smoke test ─────────────────────────────────────────────

    @Test
    fun healthConnect_readRecordsInSyncRange() = runBlocking {
        // Insert a fresh steps record within the last hour
        val now = Instant.now()
        val syncStart = now.minus(1, ChronoUnit.HOURS)
        val syncRecord = StepsRecord(
            startTime = syncStart.plus(5, ChronoUnit.MINUTES),
            endTime = syncStart.plus(10, ChronoUnit.MINUTES),
            startZoneOffset = null,
            endZoneOffset = null,
            count = 800,
            metadata = HealthMetadata(),
        )
        client.insertRecords(listOf(syncRecord))

        // Simulate what HealthConnectConnector.sync() does: read steps in range
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(syncStart, now),
            )
        )
        assertTrue(
            "La plage de synchronisation doit contenir des données (test du connecteur Health Connect)",
            response.records.isNotEmpty()
        )
        val totalSteps = response.records.sumOf { it.count }
        assertTrue("Le total des pas doit être positif", totalSteps > 0)
    }
}
