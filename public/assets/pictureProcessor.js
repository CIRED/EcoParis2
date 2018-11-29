function getColour(d){
    return  d > 200 ? 'e31a1c':
            d > 150 ? 'fc4e2a':
            d > 100 ? 'fd8d3c':
            d > 50 ? 'feb24c':
                      'ffffcc';
}

var processColour = function(binaryData, l, width, height, pixels){

  for (var i=0; i<l; i++) {
      var px = i%width
      var py = i/width

      if(px >= 0 && px < width && py >= 0 && py < height){
          var pos = i*4

          var value = pixels[i]
          binaryData[pos+2]   = parseInt(getColour(value),16) & 255
          binaryData[pos+1]   = (parseInt(getColour(value),16) >> 8) & 255
          binaryData[pos]   = (parseInt(getColour(value),16) >> 16) & 255
          if (pixels[i]==0){
              binaryData[pos+3]=0; // alpha (transparency)
          }
          else{
              binaryData[pos+3]=220;
          }
      }
  }
}

self.addEventListener('message', function(e) {
  var canvasData = e.data.canvasData;
  var binaryData = canvasData.data;
  var width = e.data.width;
  var height = e.data.height;
  var pixels = e.data.pixels;

  var l = e.data.length;
  var index = e.data.index;

  processColour(binaryData,l,width,height,pixels)

  self.postMessage({ result: canvasData, index: index });
}, false);
