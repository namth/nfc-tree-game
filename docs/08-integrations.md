# 08. Tích Hợp Phần Cứng & Dịch Vụ Bên Thứ Ba (Integrations)

Tài liệu này hướng dẫn chi tiết cách tích hợp các thư viện native và phần cứng trên **Android Studio** và **Xcode**.

---

## 1. Tích Hợp Cảm Biến NFC (`react-native-nfc-manager`)

### 1.1. Cấu hình Trên Android (`android/app/src/main/AndroidManifest.xml`)
Cần khai báo quyền phần cứng NFC và cấu hình bộ lọc Intent để app tự động bắt sự kiện khi quẹt thẻ:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Quyền truy cập phần cứng NFC -->
    <uses-permission android:name="android.permission.NFC" />
    <!-- Bắt buộc thiết bị phải có tính năng NFC -->
    <uses-feature android:name="android.hardware.nfc" android:required="true" />

    <application ...>
        <activity ...>
            <!-- Intent filter bắt thẻ NFC chuẩn NDEF -->
            <intent-filter>
                <action android:name="android.nfc.action.NDEF_DISCOVERED" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="application/octet-stream" />
            </intent-filter>
            <!-- Bắt thẻ NFC không định dạng / Thẻ trắng -->
            <intent-filter>
                <action android:name="android.nfc.action.TAG_DISCOVERED" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 1.2. Cấu hình Trên iOS (`ios/TreeNFCGame/Info.plist` & Entitlements)
1. Thêm mô tả quyền trong `Info.plist`:
```xml
<key>NFCReaderUsageDescription</key>
<string>Ứng dụng cần sử dụng NFC để đọc và gieo hạt giống cây vào khu vườn của bạn.</string>
```
2. Thêm file `TreeNFCGame.entitlements` bật tính năng đọc thẻ:
```xml
<dict>
    <key>com.apple.developer.nfc.readersession.formats</key>
    <array>
        <string>NDEF</string>
        <string>TAG</string>
    </array>
</dict>
```

---

## 2. Tích Hợp Engine Đồ Họa Skia (`@shopify/react-native-skia`)

- **Bản chất:** Skia chạy trực tiếp bằng C++ qua JSI (JavaScript Interface), bỏ qua cầu nối JSON Bridge truyền thống của React Native.
- **Tương thích:** Tương thích 100% với React Native New Architecture (Fabric / TurboModules).
- **Cấu hình:**
  - Android: Tự động liên kết qua Gradle Cmake.
  - iOS: Cài đặt CocoaPods `pod install` với cờ `use_frameworks!`.

---

## 3. Tích Hợp Rung Vật Lý & Âm Thanh Zen

### 3.1. Rung Phản Hồi Haptics (`react-native-haptic-feedback`)
Sử dụng các mẫu rung tinh tế để nâng cao cảm xúc sở hữu vật lý:
- **Khi phát hiện thẻ NFC:** Rung nhẹ kiểu `impactLight`.
- **Khi ghi thẻ thành công:** Rung 2 nhịp kiểu `notificationSuccess`.
- **Khi đọc thẻ lỗi/rút thẻ sớm:** Rung cảnh báo `notificationError`.

### 3.2. Âm Thanh Chuông Gió & Suối Reo (`react-native-sound`)
- Nhạc nền thiền định dạng vòng lặp (BGM Ambient Loop) với âm lượng nhỏ 30%.
- Tiếng chuông gió gõ nhẹ mỗi khi cành lá đung đưa trong gió.
- Tiếng chuông chùa ngân vang khi mầm cây mới được nảy mầm thành công.

---

## 4. Tích Hợp Phần Cứng Đo Đạc Uptime (`react-native-device-info`)

- Cung cấp hàm `DeviceInfo.getUptime()` và `DeviceInfo.getBootTime()` để làm nguồn tham chiếu thời gian phần cứng tuyệt đối, phục vụ động cơ chống gian lận giờ máy (Anti-Tampering Engine).
