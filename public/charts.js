var createChart = function (idElement, titleText, keys, values, ticks, categoryLabels) {
  $("#" + idElement).highcharts({
    chart: {
      type: "column"
    },
    title: {
      text: titleText
    },
    subtitle: {
      text: "Source: cert.fi"
    },
    xAxis: {
      categories: keys,
      labels: {
        enabled: categoryLabels
      },
    },
    yAxis: {
      type: "logarithmic",
      title: {
        text: "Frequency"
      },
    },
    plotOptions: {
      column: {
        borderWidth: 0
      }
    },
    series: [{
      name: "Incidents",
      data: values
    }]
  });
}
