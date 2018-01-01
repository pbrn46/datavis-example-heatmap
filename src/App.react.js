const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",]

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      xScale: null,  // Calculated
      yScale: null,  // Calculated
      colorScale: null,  // Calculated
      data: null,  // Fetched
      baseTemperature: null,  // Fetched
      title: {
        caption: "Global Surface Temperature",
        subcaption: "Relative to 1951 to 1980 average temperature, 8.66\u00b0C +/- 0.07",
      },
      dims: {
        width: 1100,
        height: 500,
        margins: {
          top: 90,
          right: 20,
          bottom: 70,
          left: 50,
        },
        title: {
          x: 50,
          y: 40,
        },
        bodyWidth: null,  // Calculated
        bodyHeight: null,  // Calculated
        legend: {
          x: 50,
          y: 460,
          square: {
            width: 50,
            height: 10,
            count: 12,
          },
        },
        popup: {
          padding: 3,
        },
      },
    }
  }
  componentDidMount() {
    this.createChart()
    this.fetchData()
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.xScale !== this.state.xScale
      || prevState.yScale !== this.state.yScale
      || prevState.colorScale !== this.state.colorScale
      || prevState.data !== this.state.data
      || prevState.monthlyVariance !== this.state.monthlyVariance
    ) {
      this.updateChart()
    }
  }
  createChart() {
    var 維 = this.state.dims

    this.svg = d3.select("#ChartContainer").append("svg")
      .attr("width", 維.width)
      .attr("height", 維.height)

    this.svgDefs = this.svg.append("defs")

    this.shadowFilter = this.svgDefs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "150%")
      .attr("width", "150%")

    this.shadowFilter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 3)
    .attr("result", "blur")

    this.shadowFilter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur")

    this.shadowFilter.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "offsetBlur")
      .attr("mode", "normal")

    this.svg.append("rect")
      .attr("class", "background")
      .attr("width", 維.width)
      .attr("height", 維.height)

    this.gTitle = this.svg.append("g")
      .attr("transform", `translate(${維.title.x},${維.title.y})`)

    this.textTitle = this.gTitle.append("text")
      .attr("class", "title")

    this.textSubtitleRange = this.gTitle.append("text")
      .attr("class", "subtitlerange")
      .attr("y", "22px")

    this.textSubtitle = this.gTitle.append("text")
      .attr("class", "subtitle")
      .attr("y", "38px")

    this.gBody = this.svg.append("g")
      .attr("transform", `translate(${維.margins.left},${維.margins.top})`)

    this.gLegend = this.svg.append("g")

    this.gPopup = this.svg.append("g")
      .attr("opacity", 0)
      .attr("class", "popup")

    this.rectPopup = this.gPopup.append("rect")
      .attr("class", "popup")
      .attr("filter", "url(#drop-shadow)")

    this.gPopupTexts = this.gPopup.append("g")
      .attr("class", "popup-texts")
  }
  fetchData() {
    var 維 = this.state.dims
    d3.json("https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json",
      ({baseTemperature, monthlyVariance: data}) => {

        data = data.map(item => ({...item, temperature: item.variance + baseTemperature}))

        var bodyWidth = 維.width - 維.margins.left - 維.margins.right
        var bodyHeight = 維.height - 維.margins.top - 維.margins.bottom

        var xScale = d3.scaleBand()
          .domain(data.map(d => d.year))
          .range([0, bodyWidth])

        var yScale = d3.scaleBand()
          .domain(data.map(d => d.month))
          .range([0, bodyHeight])

        var colorScale = d3.scaleLinear()
          .domain(d3.extent(data, d => d.temperature))
          .range([0, 1])
          .interpolate((a, b) => d3.interpolateWarm)

        this.setState((prevState, props) =>
          ({xScale, yScale, colorScale, data, baseTemperature, dims: {...prevState.dims, bodyHeight, bodyWidth}}))
      }
    )
  }
  updateChart() {
    var {xScale, yScale, colorScale, data, dims: 維, title} = this.state
    this.redrawTitle(title, xScale)
    this.redrawData(this.gBody, 維, xScale, yScale, colorScale, data)
    this.redrawAxes(this.gBody, 維, xScale, yScale)
    this.redrawLegend(this.svg, 維, colorScale)
  }
  redrawTitle(title, xScale) {
    this.textTitle
      .text(title.caption)
    this.textSubtitle
      .text(title.subcaption)
    this.textSubtitleRange
    .text(`${d3.min(xScale.domain())} to ${d3.max(xScale.domain())}`)
  }
  handleMouseOut(d) {
    this.gPopup.attr("opacity", 0)
  }
  handleMouseOver(d) {
    var {xScale, yScale, dims: 維} = this.state
    var nice = d3.format(",.1f")
    this.gPopup
      .attr("opacity", 1)
      .attr("transform",
        "translate("
          + (xScale(d.year) + 維.margins.left) + ","
          + (yScale(d.month) + 維.margins.top - 維.popup.padding * 2)
          + ")"
      )
    this.gPopupTexts
      .html(null)
    this.gPopupTexts.append("text")
      .attr("x", 0)
      .attr("y", "-14px")
      .attr("font-size", "14px")
      .text(`${monthNames[d.month - 1]} ${d.year}`)
    this.gPopupTexts.append("text")
      .attr("x", 0)
      .attr("font-size", "10px")
      .text(`${nice(d.temperature)}\u00b0C (\u0394${nice(d.variance)}\u00b0C)`)

    var bbox = this.gPopupTexts.node().getBBox()
    this.rectPopup
      .attr("x", bbox.x - 維.popup.padding)
      .attr("y", bbox.y - 維.popup.padding)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("width", bbox.width + 維.popup.padding * 2)
      .attr("height", bbox.height + 維.popup.padding * 2)
  }
  redrawData(gBody, dims, xScale, yScale, colorScale, data) {
    var datapoint = gBody.selectAll(".datapoint")
      .data(data)
    var newDatapoint = datapoint.enter()
      .append("rect")
      .attr("class", "datapoint")
    datapoint = datapoint.merge(newDatapoint)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.temperature))
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.month))
      .on("mouseover", e => this.handleMouseOver(e))
      .on("mouseout", e => this.handleMouseOut(e))
  }
  redrawAxes(gBody, dims, xScale, yScale) {
    // x axis
    gBody.append("g")
      .attr("transform", `translate(0,${dims.bodyHeight})`)
      .call(
        d3.axisBottom(xScale)
          .tickValues(xScale.domain().filter(item => (item % 10 === 0)))
          .tickSizeOuter(0)
      )
    // y axis
    gBody.append("g")
      .call(
        d3.axisLeft(yScale)
          .tickFormat(item => monthNames[item - 1])
          .tickSizeOuter(0)
      )
  }
  redrawLegend(svg, dims, colorScale) {
    var legendData = d3.quantize(
      d3.interpolate(
        colorScale.domain()[0],
        colorScale.domain()[1]),
      dims.legend.square.count)
    var gLegend = this.gLegend
      .attr("transform", `translate(${dims.legend.x},${dims.legend.y})`)
    var legendSquare = gLegend.selectAll(".legendSquare")
      .data(legendData)
    var newLegendSquare = legendSquare.enter()
      .append("rect")
      .attr("class", "legendSquare")
    legendSquare = legendSquare.merge(newLegendSquare)
      .attr("width", dims.legend.square.width)
      .attr("height", dims.legend.square.height)
      .attr("x", (d, i) => i * dims.legend.square.width)
      .attr("y", 0)
      .attr("fill", d => colorScale(d))

    // legend axis
    var legendScale = d3.scaleBand()
      .domain(legendData)
      .range([0, dims.legend.square.width * dims.legend.square.count])
    gLegend.append("g")
      .attr("transform", `translate(0,${dims.legend.square.height})`)
      .call(d3.axisBottom(legendScale)
        .tickFormat(d3.format(",.1f"))
        .tickSizeOuter(0))
  }
  render() {
    return (
      <div className="container-fluid App">

        <div className="modal fade" id="InfoModal" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <p>
                  An example of data visualization of a heatmap using
                  D3.js.
                </p>
                <div>Showcase Features</div>
                <ul>
                  <li>Data parsing, formatting, and scaling in D3.js over SVG</li>
                  <li>Bootstrap tooltips</li>
                </ul>
                <div>Libraries used in this example:</div>
                <ul>
                  <li>D3.js</li>
                  <li>Bootstrap</li>
                  <li>React</li>
                </ul>
                <p className="small">Written by Boris Wong, December 2017. MIT license.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              Data Visualization Example - Heatmap
              {' '}<button
                     type="button"
                     className="btn btn-info btn-sm"
                     data-toggle="modal"
                     data-target="#InfoModal">Info</button>
            </h3>
          </div>
          <div className="card-body ChartContainerWrapper">
            <div id="ChartContainer"></div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
