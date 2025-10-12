void setup() {
  Serial.begin(115200);
}

#define START_VOLTAGE 5.0 

const int sensorPins[] = {A0, A1, A2, A3, A4, A5, A6, A7}; 
const int numSensors = sizeof(sensorPins) / sizeof(sensorPins[0]);

const float knownResistor = 10.0;  // Reference resistor

void loop() {
    String result = "[";
    for (int i = 0; i < numSensors; i++) {
        int sensorPin = sensorPins[i];
        int sensorValue = analogRead(sensorPin);
        float voltage = sensorValue * (START_VOLTAGE / 1023.0);
        float resistance = (voltage > 0) ? (knownResistor * (START_VOLTAGE - voltage)) / voltage : 0;

        result = result + "{ \"Volt\":" + String(voltage, 4) +  // 2 decimal places
                    ", \"Resistance\":" + String(resistance, 2) + 
                    ", \"Sensor\":" + String(i) + String((i==numSensors-1) ? "}" : "},");
    }
    Serial.print(result+"]");
    delay(150); 
}
