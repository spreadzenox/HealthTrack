package com.healthtrack.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

/**
 * Vignette de Pilou dans les notifications (étape 13 du brief ; specs/journee.SPEC.md § 9) : les mêmes images
 * pré-rendues que le widget (res/drawable-nodpi/pilou_pose_*.webp). Le texte de la notification dit tout ; l'image ne
 * porte aucune information à elle seule.
 */
final class PilouNotice {

    private PilouNotice() {
    }

    /** Pose du soir (la notification demande quelque chose le soir). */
    static Bitmap evening(Context context) {
        return decode(context, R.drawable.pilou_pose_soir);
    }

    /** Pose contente (la notification confirme que c'est noté : Pilou réagit au fait de noter, pas à la réponse). */
    static Bitmap noted(Context context) {
        return decode(context, R.drawable.pilou_pose_content);
    }

    private static Bitmap decode(Context context, int res) {
        try {
            return BitmapFactory.decodeResource(context.getResources(), res);
        } catch (RuntimeException e) {
            return null; // sans image, la notification reste la même
        }
    }
}
