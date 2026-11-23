package ec.runcty.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // `super.onCreate` switches from the splash theme to `AppTheme.NoActionBar` and creates the
        // window. Enabling edge-to-edge before it installed the window with the splash theme, which
        // on Samsung (Android 16) kept a title bar: the white band with «RUNCTY» above every page.
        super.onCreate(savedInstanceState);

        // Draw behind the status and gesture bars on every Android version (15+ already enforces
        // it): with `viewport-fit=cover` the WebView receives the insets as `env(safe-area-inset-*)`
        // and the page paints its own color behind the bars instead of a separate band. Capacitor's
        // SystemBars plugin sets the icon style afterwards (it runs on the next main-thread turn).
        EdgeToEdge.enable(this);

        // SystemBars already lifts the WebView above the keyboard by padding the window by the IME
        // height. Passing the IME inset on as well makes WebView 139+ shrink its viewport a second
        // time, which left an empty black area between the form and the keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (view, insets) -> {
            WindowInsetsCompat withoutKeyboard = new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.ime(), Insets.NONE)
                .build();
            return ViewCompat.onApplyWindowInsets(view, withoutKeyboard);
        });
    }
}
