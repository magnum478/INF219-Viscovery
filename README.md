# INF219-Viscovery

## Installing and running
The Viscovery chrome extension require a server side component -> phantomCloud to fetch images of the search urls.

The current localhost server component runs on <a href="https://nodejs.org/en/"> Node.js. </a>

After installing Node.js navigate to the phantomCloud root folder containing the app.js and run the command: 
```
npm install
```
to install all the dependencies/packages.

When all dependencies are installed, run
```
npm start
```
to start the server.

The extension requires <a href="https://www.google.no/chrome/browser/canary.html"> Google Chrome Canary. </a>

To install the extension -> navigate to the extension tab in canary

```
chrome://extensions
```
and enable developer mode.

Load the Viscovery folder as an unpacked extension.

## Notes
The settings field is only a placeholder atm.

