package ec.runcty.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Draw behind the status and gesture bars on every Android version (15+ already enforces
        // it): with `viewport-fit=cover` the WebView receives the insets as `env(safe-area-inset-*)`
        // and the page paints its own color behind the bars instead of a separate band. Called
        // before `super.onCreate` so Capacitor's SystemBars plugin sets the icon style afterwards.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
