#define LED 13

void setup() {
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
}

void loop() {
    if (Serial.available()) {
        byte rx = Serial.read();

        Serial.print("(arduino rx: ");
        Serial.print(rx);
        Serial.print(")");

        digitalWrite(LED, rx);
    }
}
