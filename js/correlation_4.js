// ========== INSTRUCTIONS ==========
/*
 *  If you have changed a layer and you want it to be part of the hotspots layer, you should recompute it here.
 *
 *  STEPS:
 *      - chose a set of layers you want to use
 *      - update [1] [2] and [3] below (around lines 100) to contain the name of the rasters you will use, and their number.
 *      - run the script ("python -m http.server") and download your file when it is done
 */

var change_referential = function(px,py,output_p,input_p){
    var current_tx = px / (output_p.width - 1) //between 0 and 1 included
    var current_ty = py / (output_p.height - 1)

    var current_lng = ((1-current_tx) * output_p.tl_lng + current_tx * output_p.br_lng) * 100000
    var current_lat = ((1-current_ty) * output_p.tl_lat + current_ty * output_p.br_lat) * 100000


    var input_tl_lng = input_p.tl_lng * 100000 //to correct floating point imprecisions later
    var input_tl_lat = input_p.tl_lat * 100000 //anyway, we apply the same factor to every coordinates,
    var input_br_lng = input_p.br_lng * 100000 //so the rations stay the scc
    var input_br_lat = input_p.br_lat * 100000

    var original_tx = (current_lng - input_tl_lng) / (input_br_lng - input_tl_lng) //between 0 and 1, included (should anyway)
    var original_ty = (input_tl_lat - current_lat) / (input_tl_lat - input_br_lat)

    var original_px = Math.floor(original_tx * (input_p.width - 1))
    var original_py = Math.floor(original_ty * (input_p.height - 1)) //in the original image, the one that generated the containment data
    
    return [original_px,original_py]
}

//l=height_length
var processData = function(output, output_p, input, input_p){
    for (var i=0; i<output_p.width*output_p.height; i++) {

      var px = i%output_p.width
      var py = Math.floor(i/output_p.width)
      var pos = px + py*output_p.width
      
      var new_pos = change_referential(px,py,output_p,input_p)
      var input_px = new_pos[0]
      var input_py = new_pos[1]

      var value = 0
      
      if (input_px >= 0 && input_py >= 0 && input_px < input_p.width && input_py < input_p.width){ 
          var pos_original = (input_px + input_py * input_p.width)
          value = input[pos_original]
      }
      if (input[pos_original] != null && output[pos] != null){
        output[pos] += value     
      }
      else{
        output[pos] = null
      }
      
    }
}


var normalize = function(data){
    var max = 0;
    for( var i = 0; i < data.length; i++ ){
        if(data[i]>max){
                max = data[i]
        }
    }
    
    for( var i = 0; i < data.length; i++ ){
        if (data[i] != null){
             data[i] /= max
        }
    }
}


var loadData = function (url) {
  return fetch(url)
    .then(res => res.json())
    .then(json => {
        console.log(json)
      json.data = JSON.parse(json.data)
      return json
    })
}


function download(text, OutputFileName) {
    d3.select(".container").append("a").attr("id","a_image")
    var a = document.getElementById("a_image");
    var file = new Blob([text], {type: 'json'});
    a.href = URL.createObjectURL(file);
    a.innerHTML="Click here to download "+OutputFileName
    d3.select(".container").append("br")
    a.download = OutputFileName;
}

function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}

whenDocumentLoaded(() => {
    queue()
        //                                                                                                          ======== [1] BEGINS HERE =======
        .defer(d3.json, "data/rasters/L_ref.json")
        .defer(d3.json, "data/rasters/n_ret_ref.json")
        .defer(d3.json, "data/rasters/pollination_ref.json")
        .defer(d3.json, "data/rasters/T_reduction.json")
        //                                                                                                          ======== [1] ENDS HERE =======
        .await(loadJSON); // When the GeoJsons are fully loaded, call the function loadGeom

        //                                                                                                          ======== [2] BEGINS HERE =======
    function loadJSON(error, metric1, metric2, metric3, metric4){
        //                                                                                                          ======== [2] ENDS HERE =======
        var output_width = 1943 //same as our reference image, so that the image is not too big (8000 x 6000...)
        var output_height = 1586
        var OutputFileName = "correlation_ref.json" //.json
        var HistogramBins = [80,160] //3 categories: 0-80, 81-160, 161-255
        
        //                                                                                                          ======== [3] ENDS HERE =======
        var metric = []
        metric[0] = metric1
        metric[1] = metric2
        metric[2] = metric3
        metric[3] = metric4
        //                                                                                                          ======== [3] ENDS HERE =======
        
        //var North = 49.215485585
        //var South = 48.127383524
        //var West = 1.473787809
        //var East = 3.472059898
        
        var tl_lats = []
        var tl_lngs = []
        var br_lats = []
        var br_lngs = []

        for (var i=0; i<metric.length; i++) {
            tl_lats[i] = metric[i].tl_lat
            tl_lngs[i] = metric[i].tl_lng
            br_lats[i] = metric[i].br_lat
            br_lngs[i] = metric[i].br_lng
            metric[i].data = JSON.parse(metric[i].data)
            normalize(metric[i].data)
        }

        var North = Math.min(...tl_lats)
        var South = Math.max(...br_lats)
        var West = Math.max(...tl_lngs)
        var East = Math.min(...br_lngs)
        var tl = new L.LatLng(North,West)
        var br = new L.LatLng(South,East)

        var output = []
        for (var i=0; i<output_width*output_height; i++) {
            output[i] = 0
        }

        output_p = {
            "width":output_width,
            "height":output_height,
            "tl_lat":tl.lat,
            "tl_lng":tl.lng,
            "br_lat":br.lat,
            "br_lng":br.lng,
        }
        
        for (var i=0; i<metric.length; i++){
            input_p = {
                "width":metric[i].width,
                "height":metric[i].height,
                "tl_lat":metric[i].tl_lat,
                "tl_lng":metric[i].tl_lng,
                "br_lat":metric[i].br_lat,
                "br_lng":metric[i].br_lng,
            }
            processData(output,output_p,metric[i].data,input_p)
        }

        var sorted = output.slice()
        sorted.sort((x,y) => parseInt(x)>parseInt(y))

        var percentile_25 = sorted[Math.floor(sorted.length * 0.25)]
        var percentile_50 = sorted[Math.floor(sorted.length * 0.50)]
        var percentile_75 = sorted[Math.floor(sorted.length * 0.75)]

        for(var i=0; i<output.length; i++){
            if (output[i] != null){
                output[i] /= metric.length
                output[i] *= 255
                output[i] = Math.round(output[i])
            }
        }
        download(JSON.stringify({"width":output_width,
                                "height":output_height,
                                "tl_lat":tl.lat,
                                "tl_lng":tl.lng,
                                "br_lat":br.lat,
                                "br_lng":br.lng,
                                "percentiles":JSON.stringify([percentile_25,percentile_50,percentile_75]),
                                "buckets":JSON.stringify(HistogramBins),
                                "data":JSON.stringify(output)}),OutputFileName)

        alert("File generated!")
    }
});                             
