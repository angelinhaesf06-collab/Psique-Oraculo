package com.psiqueoraculo;

import android.os.Bundle;
import android.graphics.Color;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Fix da Faixa Branca: Força as cores bege nativas no StatusBar e NavigationBar
        int oracleBeige = Color.parseColor("#FDFBF7");
        getWindow().setStatusBarColor(oracleBeige);
        getWindow().setNavigationBarColor(oracleBeige);
        
        // Garante que o conteúdo não seja cortado (EdgeToEdge com controle)
        EdgeToEdge.enable(this);
    }
}
