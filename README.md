# Setup
1) Download & install node.js locally: https://nodejs.org/en/download/

2) Install ionic & cordova globally:
```sh
sudo npm install -g cordova ionic
```

3) Install project tool dependencies from NPM:
```sh
npm install
```

4) Install project code dependencies from Bower:
```sh
node_modules/.bin/bower install
```

5) Start local development session:
```sh
ionic serve
```

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