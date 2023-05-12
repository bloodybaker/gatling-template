let bj = null
let myChart=null
var simulationIndex = null
var requestIndex = null
var selectedRequest = null
var buffName = null
var checked = false

fetch('../data/report.json')
  .then((response) => response.json())
  .then((json) => {
    buildTree(json['simulations'], document.getElementById("tree"));
    bj = json['simulations']
});

function buildTree(data, container) {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'simulations');
  container.appendChild(ul);

  for(item = 0; item < data.length; item++) {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-m-flex', 'justify-content-start', 'align-items-left');
    ul.appendChild(li);

    const name = document.createElement('span');
    name.innerHTML = data[item].simulationName.replace("simulation", " simulation");
    li.appendChild(name);

    if (data[item].requests && data[item].requests.length > 0) {
      const simulationsContainer = document.createElement('div');
      simulationsContainer.classList.add('collapse');
      li.appendChild(simulationsContainer);

      const simulationsList = document.createElement('ul');
      simulationsList.classList.add('list-group', 'list-group-flush');
      simulationsContainer.appendChild(simulationsList);

      for(request = 0; request < data[item].requests.length; request++) {
        const requestItem = document.createElement('li');
        requestItem.classList.add('list-group-item', 'd-flex', "flex-column", 'justify-content-between', 'align-items-left');
        simulationsList.appendChild(requestItem);

        const requestName = document.createElement('span');
        requestName.innerHTML = data[item].requests[request].requestName;
        requestName.classList.add("small","request")
        requestName.setAttribute("simulation", data[item].simulationName)
        requestName.setAttribute('id', 'request')
        requestItem.appendChild(requestName);
      };

      const toggleSimulations = document.createElement('button');
      toggleSimulations.innerHTML = '+';
      toggleSimulations.classList.add('btn', 'btn-outline-secondary');
      ul.appendChild(toggleSimulations);

      toggleSimulations.addEventListener('click', () => {
        if (simulationsContainer.classList.contains('show')) {
          toggleSimulations.innerHTML = '+';
          simulationsContainer.classList.remove('show');
        } else {
          toggleSimulations.innerHTML = '-';
          simulationsContainer.classList.add('show');
        }
      });
    
    }
  }
}

$(document).ready(function(){
  $(".request").click(function(){
    $(".request").css('font-weight','normal')
    $(".request").attr('id', '')
    $(this).css('font-weight','bold')
    $(this).attr('id', 'request')
    if(!checked){
      $('#options').prop( "disabled", false)
      $('#mySwitch').prop('disabled', false)
    }
    $('#chart').css('display','block')
    $('#table').css('display','none')
    for(sim = 0; sim < bj.length; sim++){
      if(bj[sim].simulationName === $(this).attr('simulation')){
        for(req = 0; req < bj[sim].requests.length; req++){
          if(bj[sim].requests[req].requestName == $(this).text()){
            simulationIndex = sim
            selectedRequest = $(this).text()
            requestIndex = req
          }
        }
      }
    }
    document.getElementById("meta-text").innerHTML = selectedRequest
    buffName = selectedRequest
    if(!checked){
      populateData()
    }else{
      buildGraphWithAllAttributes()
    }
    $('html, body').animate({
      scrollTop: $("#chart").offset().top  - 190
  }, 100);
  });
});

function populateData(){
  var type = $('#options').find(":selected").val()
  var xValues = [];
  var yValues = [];
  selectedRequest = bj[simulationIndex].requests[requestIndex].requestDataList
  for(sprint = 0; sprint < selectedRequest.length; sprint++){
      xValues.push(selectedRequest[sprint]['sprint'].replace('_'," "))
      var yData = {
          y : selectedRequest[sprint][$('#options').find(":selected").val()],
          "% failed" : selectedRequest[sprint].percentOfFailedRequests,
          repeats : selectedRequest[sprint].repeats,
          users: selectedRequest[sprint].concurrentUsers 
      };
      yValues.push(yData)
  }
  var type = $('#options').find(":selected").val()
  buildGraph(xValues, yValues, "[" + type + "] " + bj[simulationIndex].requests[requestIndex].requestName)
}

function buildGraph(xValues, yValues, titleText){
  if(myChart!=null){
    myChart.destroy();
  }
  myChart = new Chart("chart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        backgroundColor:"rgba(0,0,255,1.0)",
        borderColor: "rgba(0,0,255,0.1)",
        fill:false,
        data: yValues
      }]
    },
    options:{
      legend: { display: false },
      title: {
        display: true,
        text: titleText
      }
    }
  })
}

function showData(){
  var activePoint = myChart.getElementAtEvent(event);

  if (activePoint.length > 0) {
    var clickedDatasetIndex = activePoint[0]._datasetIndex;
    var clickedElementindex = activePoint[0]._index;
    var value = myChart.data.datasets[clickedDatasetIndex].data[clickedElementindex]; 
    $('#table').css('display','block')
    var table = document.getElementById('table')
    var rowCount = table.rows.length;
    for (var x=rowCount-1; x>0; x--) {
      table.deleteRow(x);
    }
    for(let key in value){
      if(key != 'y'){
        row = table.insertRow();
        cellA = row.insertCell();
        cellB = row.insertCell();
        cellA.innerHTML = key;
        cellB.innerHTML = value[key];
      }
    }
  }
}

function selectedOption(){
  populateData()
}

function moveToSelected(){
  $('html, body').animate({
    scrollTop: $("#request").offset().top  - 190
}, 100);
}

$(document).ready(function(){
  $("#mySwitch").click(function(){
    var switcher = $('#mySwitch')
    if(switcher.val() == 'no'){
      $('#mySwitch').attr('value', 'yes')
      $('#options').attr('disabled', true)
      checked = true
      buildGraphWithAllAttributes()
    }else{
      $('#mySwitch').attr('value', 'no')
      $('#options').attr('disabled', false)
      checked = false
      populateData()
    }
  })
})



function buildGraphWithAllAttributes(){
  var types = ['minTime','maxTime','averageTime']
  var labels = ['Min','Max','Avg'] 
  var backgroundColors = ["rgba(0,255,0,1.0)", "rgba(255,0,0,1.0)", "rgba(0,0,255,1.0)"]
  var borderColors = ["rgba(0,255,0,0.1)", "rgba(255,0,0,0.1)", "rgba(0,0,255,0.1)"]
  var xValues = [];
  var yValues = [];
  selectedRequest = bj[simulationIndex].requests[requestIndex].requestDataList
  for(type = 0; type < types.length; type++){
    var buffY = []
    for(sprint = 0; sprint < selectedRequest.length; sprint++){
      var spname = selectedRequest[sprint]['sprint'].replace('_'," ")
      if(!xValues.includes(spname)){
        xValues.push(spname)
      }
      var tempData = {
        y : selectedRequest[sprint][types[type]],
        "% failed" : selectedRequest[sprint].percentOfFailedRequests,
        repeats : selectedRequest[sprint].repeats,
        users: selectedRequest[sprint].concurrentUsers
      }
      buffY.push(tempData)
    }
    var data = {
      label: labels[type],
      backgroundColor:backgroundColors[type],
      borderColor: borderColors[type],
      fill: false,
      data: buffY
    }
    yValues.push(data)
  }

  if(myChart!=null){
    myChart.destroy();
  }
  myChart = new Chart("chart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: yValues
    },
    options:{
      legend: { display: true },
      title: {
        display: true,
        text: bj[simulationIndex].requests[requestIndex].requestName
      }
    }
  })
}