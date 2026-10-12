package com.healthtrack.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins maison (non publiés sur npm) : à enregistrer avant super.onCreate.
        registerPlugin(PhoneUsagePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
