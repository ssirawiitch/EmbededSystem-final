#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// ---------------------------------------------------------------------------
// 1. ตั้งค่า Wi-Fi และ Firebase
// ---------------------------------------------------------------------------
#define WIFI_SSID "ROOM_704_2.4G"       
#define WIFI_PASSWORD "wavesun1669"         

// API Key จาก Project Settings -> General -> Web API Key
#define API_KEY "AIzaSyBfU9wKJUiAk5QEV4Wp-7sp3sHznY_Ut_o" 


#define DATABASE_URL "smart-plant-care-system-179aa-default-rtdb.asia-southeast1.firebasedatabase.app" 


#define RX_PIN 17   
#define TX_PIN 18   
#define BAUDRATE 9600 

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

// ฟังก์ชันแจ้งเตือนสถานะ Token 
void tokenStatusCallback(TokenInfo info){
    if (info.status == token_status_ready){
        Serial.println("Token: Ready");
    } else {
        Serial.print("Token Info: ");
        Serial.println(info.status);
    }
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(BAUDRATE, SERIAL_8N1, RX_PIN, TX_PIN);

  Serial.println("\n--------------------------------");
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected! IP: ");
  Serial.println(WiFi.localIP());


  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

 
  fbdo.setBSSLBufferSize(1024, 1024); 
  
 
  config.token_status_callback = tokenStatusCallback; 

  // ลงชื่อเข้าใช้
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Sign-up OK");
    signupOK = true;
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Serial1.available()) {
    String data = Serial1.readStringUntil('\n');
    data.trim();

    Serial.print("Rx: ");
    Serial.println(data);

    if (data.startsWith("S") && data.endsWith("E") && signupOK) {
      
      if (Firebase.ready()) {
          int soil, light, temp, humid;
          if (sscanf(data.c_str(), "S%dL%dT%dH%dE", &soil, &light, &temp, &humid) == 4) {
            
            Serial.println("Sending to Firebase...");

            
            if (Firebase.RTDB.setInt(&fbdo, "/Sensor/Soil", soil)) {
                Serial.println(" > Soil OK");
            } else {
                Serial.print(" > Soil Error: "); Serial.println(fbdo.errorReason());
            }
            
            if (Firebase.RTDB.setInt(&fbdo, "/Sensor/Light", light)) Serial.println(" > Light OK");
            if (Firebase.RTDB.setInt(&fbdo, "/Sensor/Temp", temp)) Serial.println(" > Temp OK");
            if (Firebase.RTDB.setInt(&fbdo, "/Sensor/Humid", humid)) Serial.println(" > Humid OK");
            
          } else {
            Serial.println("Error: Parse Fail");
          }
      } else {
          Serial.println("Firebase not ready yet...");
      }
    }
  }
}