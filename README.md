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

The extension will load when the user navigates to the google search page, which it will scale and display images of the top search results.

## Notes
The settings field is only a placeholder atm.

Inspection view is triggered by hovering over the links on the left side, or left clicking an image on the right side.

To open the url the image is representing, shift-click the image.

## Image gallery
##### Juxta positioning
![Alt text](/Readme_Images/displayJuxta.png?raw=true "Juxta positioning")

##### Inspection view
![Alt text](/Readme_Images/displayFront.png?raw=true "Front positioning")
