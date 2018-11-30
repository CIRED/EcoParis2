function getColour(d){
    return  d > 200 ? 'e31a1c':
            d > 150 ? 'fc4e2a':
            d > 100 ? 'fd8d3c':
            d > 50 ? 'feb24c':
                      'ffffcc';
}

var processColour = function(binaryData, l, width, height, pixels, shift, containmentWidth, containmentHeight, voronoiContainmentData, interCommContainmentData, voronoi_means, voronoi_counts ,interComm_means, interComm_counts){

  for (var i=0; i<l; i++) {
      var px = i%width
      var py = i/width

      if(px >= 0 && px < width && py >= 0 && py < height){
          var pos = i*4

          var value = pixels[shift + i]

          var voronoi_id = voronoiContainmentData[shift + i]
          var interComm_id = voronoiContainmentData[shift + i]

          if (voronoi_id != 0){
            voronoi_counts[voronoi_id-1] += 1
            voronoi_means[voronoi_id-1] += value
          }

          if (interComm_id != 0){
            interComm_counts[interComm_id-1] += 1
            interComm_means[interComm_id-1] += value
          }

          binaryData[pos+2]   = parseInt(getColour(value),16) & 255
          binaryData[pos+1]   = (parseInt(getColour(value),16) >> 8) & 255
          binaryData[pos]   = (parseInt(getColour(value),16) >> 16) & 255
          if (pixels[shift + i]==0){
              binaryData[pos+3]=0; // alpha (transparency)
          }
          else{
              binaryData[pos+3]=220;
          }
      }
  }
}

self.addEventListener('message', function(e) {
  if (e.data.canvasData == null){
    return //it might be another type of message, don't handle it
  }
  var canvasData = e.data.canvasData;
  var binaryData = canvasData.data;
  var width = e.data.width;
  var height = e.data.height;
  var pixels = e.data.pixels;
  var containmentWidth = e.data.containmentWidth
  var containmentHeight = e.data.containmentHeight
  var voronoiContainmentData = e.data.voronoiContainmentData
  var interCommContainmentData = e.data.interCommContainmentData
  var numVoronois = e.data.numVoronois
  var numInterComms = e.data.numInterComms

  var l = e.data.length;
  var index = e.data.index;

  //initalize means and counts arrays
  var voronoi_means = []
  var voronoi_counts = []

  for (var i=0; i<numVoronois; ++i){
    voronoi_counts[i] = 0
    voronoi_means[i] = 0
  }

  var interComm_means = []
  var interComm_counts = []

  for (var i=0; i<numInterComms; ++i){
    interComm_counts[i] = 0
    interComm_means[i] = 0
  }

  processColour(binaryData,l,width,height,pixels, l*index, containmentWidth, containmentHeight, voronoiContainmentData, interCommContainmentData, voronoi_means, voronoi_counts ,interComm_means, interComm_counts)

  self.postMessage({result: canvasData, 
                    index: index,
                    voronoi_means:voronoi_means,
                    voronoi_counts:voronoi_counts,
                    interComm_means,interComm_means,
                    interComm_counts:interComm_counts });
}, false);
