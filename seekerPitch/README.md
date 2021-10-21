# Seeker Service Worker

A tile system with API that supports access to the Seeker Archive by enabling time scrubbing in a window of time
and playback at 2n speed.

This library is moostly comprised of a  service worker that intercepts special urls for for time tiles. Requests to the two special urls will do some behind the scenes computation create the correct time tile.  

## Service Worker Example Usage
  1. install ```import 'serviceWorkerInstaller.js'```
  2. reload 
  3. request `await fetch('./AWFImageTiles/TreeHouse/64/13/1633465647000')`

## Javascript Example Usage
  1. install ```import 'serviceWorkerInstaller.js'```
  2. reload 
  3. request `await fetch('./AWFImageTiles/TreeHouse/64/13/1633465647000')`

## API
Special URLS will be intercepted by the service worker. Those urls will need to follow the form.
* Full sized images `'./AWFImageTiles/{CameraID}/{SlotCount}/{tz}/{timestamp}'`
* Thumbnails `'./AWFThumbnailTiles/{CameraID}/{SlotCount}/{tz}/{timestamp}'`

## Time Tile Explanation
Tz stand for time-zoom. 2<sup>tz</sup> is the tile duration in seconds (2<sup>0</sup>=1 second, 2<sup>25</sup>=~1.06 year)




