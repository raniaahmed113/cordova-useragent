# Setup
1) Download & install node.js locally: https://nodejs.org/en/download/

2) Install ionic & cordova globally:
```sh
sudo npm install -g cordova ionic
```

3) Install tool dependencies (bower, gulp, etc):
```sh
npm install
```

4) Install cordova plugins (optional for local development via `ionic serve`, required for building the app)
```sh
ionic state reset
```

5) Setup the project:
```sh
npm run setup
```

6) Start local development session:
```sh
ionic serve
```

# Testing on iOS
0) Download `XCode` app if you don't have it already
1) Ask `ernestas@vertex.lt` to go to `https://developer.apple.com/account/#/people/62N89448NZ` and add you as a developer
2) Open `platforms/ios/Flirtas.lt.xcodeproj` in XCode
3) Enable developer mode in settings of your iOS device, then connect it via USB
4) Setup project provisioning profile using Vertex team
5) Build the project:
```sh
ionic build ios
```
6) Click `Run`

# Testing on Android
0) Download & setup Java JDK, Android SDK
1) Enable USB debugging on Android device & connect it to computer via USB or remote adb
2) Deploy the app:
```sh
ionic run android
```

# Testing local API on a real device
1) Make your local API project available through outside:
```sh
vagrant share --name my-api
```

2) Insert the generated URL into `www/js/config.js`

# Releasing an update to Google Play Store
1) Increment version in `config.xml`

2) Run:
```sh
ionic build android --release
```

3) Upload the .apk: `platforms/android/build/outputs/apk/android-release.apk`

Android version code is generated automatically, as such:
https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#setting-the-version-code

# Updating Ionic
TODO