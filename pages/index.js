import Head from "next/head";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Visualization.module.css";
import tableStyles from "@/styles/Visualization.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const customerData = [
  {
    quarter: "2023-Q3",
    rows: [
      { type: "Existing Customer", opps: 46, acv: 1322310, percentage: "57%" },
      { type: "New Customer", opps: 14, acv: 983031, percentage: "43%" },
      { type: "Total", opps: 60, acv: 2305341, percentage: "100%" }
    ]
  },
  {
    quarter: "2023-Q4",
    rows: [
      { type: "Existing Customer", opps: 45, acv: 1124857, percentage: "74%" },
      { type: "New Customer", opps: 10, acv: 387300, percentage: "26%" },
      { type: "Total", opps: 55, acv: 1512157, percentage: "100%" }
    ]
  },
  {
    quarter: "2024-Q1",
    rows: [
      { type: "Existing Customer", opps: 51, acv: 1360047, percentage: "81%" },
      { type: "New Customer", opps: 6, acv: 313189, percentage: "19%" },
      { type: "Total", opps: 57, acv: 1673236, percentage: "100%" }
    ]
  },
  {
    quarter: "2024-Q2",
    rows: [
      { type: "Existing Customer", opps: 23, acv: 647821, percentage: "74%" },
      { type: "New Customer", opps: 6, acv: 224643, percentage: "26%" },
      { type: "Total", opps: 29, acv: 872465, percentage: "100%" }
    ]
  }
];

const totals = {
  "Existing Customer": { opps: 165, acv: 4455036, percentage: "70%" },
  "New Customer": { opps: 36, acv: 1908164, percentage: "30%" },
  "Total": { opps: 201, acv: 6363200, percentage: "100%" }
};

export default function Home() {
  const tableRef = useRef();
  const barChartRef = useRef();
  const pieChartRef = useRef();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clear existing charts
    d3.select(barChartRef.current).selectAll("*").remove();
    d3.select(pieChartRef.current).selectAll("*").remove();

    // Create Bar Chart
    const barMargin = { top: 40, right: 30, bottom: 80, left: 80 };
    const barWidth = barChartRef.current.clientWidth - barMargin.left - barMargin.right;
    const barHeight = barChartRef.current.clientHeight - barMargin.top - barMargin.bottom;

    const svg = d3.select(barChartRef.current)
      .append("svg")
      .attr("width", barWidth + barMargin.left + barMargin.right)
      .attr("height", barHeight + barMargin.top + barMargin.bottom)
      .append("g")
      .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

    const quarters = customerData.map(d => d.quarter);
    const stackedData = d3.stack()
      .keys(['Existing Customer', 'New Customer'])
      .value((d, key) => d.rows.find(r => r.type === key).acv)
      (customerData);

    const x = d3.scaleBand()
      .domain(quarters)
      .range([0, barWidth])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(customerData, d => d.rows.find(r => r.type === 'Total').acv)])
      .range([barHeight, 0]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${barHeight})`)
      .call(d3.axisBottom(x))
      .call(g => {
        g.selectAll(".domain").attr("stroke", "#e0e0e0");
        g.selectAll(".tick line").remove();
        g.selectAll(".tick text")
          .style("font-size", "12px")
          .style("color", "#666")
          .style("text-anchor", "middle");
      });

    // Add Y axis
    const yAxisTicks = [0, 200000, 400000, 600000, 800000, 1000000, 1200000, 1400000, 1600000, 1800000, 2000000, 2200000, 2400000];
    svg.append("g")
      .call(d3.axisLeft(y)
        .tickValues(yAxisTicks)
        .tickFormat(d => {
          if (d === 0) return "$0.0";
          return `$${d >= 1000000 ? (d/1000000).toFixed(1) + 'M' : (d/1000).toFixed(0) + 'K'}`;
        }))
      .call(g => {
        g.selectAll(".domain").remove();
        g.selectAll(".tick line")
          .attr("x2", barWidth)
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 1);
        g.selectAll(".tick text")
          .attr("x", -10)
          .style("font-size", "11px")
          .style("color", "#666");
      });

    // Add Y axis grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickValues(yAxisTicks)
        .tickSize(-barWidth)
        .tickFormat("")
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 1);
      });

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(['Existing Customer', 'New Customer'])
      .range(['#5B87DB', '#FF9B42']);

    // Create bars
    const bars = svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
      .attr("fill", d => color(d.key));

    bars.selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.quarter))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    // Add value and percentage labels for each segment
    stackedData.forEach((layer, i) => {
      svg.selectAll(`.value-label-${i}`)
        .data(layer)
        .join("text")
        .attr("class", `value-label-${i}`)
        .attr("x", d => x(d.data.quarter) + x.bandwidth() / 2)
        .attr("y", d => {
          const height = y(d[0]) - y(d[1]);
          const midpoint = y(d[1]) + height / 2;
          return midpoint;
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .text(d => {
          const value = d[1] - d[0];
          const percentage = d.data.rows.find(r => r.type === layer.key).percentage;
          return `$${(value / 1000).toFixed(0)}K\n(${percentage})`;
        })
        .call(wrapText);
    });

    // Helper function to wrap text (for percentage labels)
    function wrapText(text) {
      text.each(function() {
        const text = d3.select(this);
        const words = text.text().split('\n');
        
        text.text('');
        
        words.forEach((word, i) => {
          text.append('tspan')
            .text(word)
            .attr('x', text.attr('x'))
            .attr('dy', i === 0 ? '-0.6em' : '1.2em');
        });
      });
    }

    // Add total value labels at the top of each bar
    svg.selectAll(".total-label")
      .data(customerData)
      .join("text")
      .attr("class", "total-label")
      .attr("x", d => x(d.quarter) + x.bandwidth() / 2)
      .attr("y", d => y(d.rows.find(r => r.type === 'Total').acv) - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => `$${(d.rows.find(r => r.type === 'Total').acv / 1000).toFixed(0)}K`);

    // Add X axis label with adjusted position
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", barWidth / 2)
      .attr("y", barHeight + 35)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("color", "#666")
      .text("Closed Fiscal Quarter");

    // Add legend with adjusted position
    const legend = svg.append("g")
      .attr("transform", `translate(0, ${barHeight + 35})`);

    const legendItems = [
      { key: "Existing Customer", color: "#5B87DB" },
      { key: "New Customer", color: "#FF9B42" }
    ];

    legendItems.forEach((item, i) => {
      const legendGroup = legend.append("g")
        .attr("transform", `translate(${i * 160}, 0)`);

      legendGroup.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", item.color);

      legendGroup.append("text")
        .attr("x", 24)
        .attr("y", 11)
        .attr("font-size", "12px")
        .style("color", "#666")
        .text(item.key);
    });

    // Create Pie Chart
    const pieWidth = pieChartRef.current.clientWidth;
    const pieHeight = pieChartRef.current.clientHeight;
    const radius = Math.min(pieWidth, pieHeight) / 2 - 80;

    const pieSvg = d3.select(pieChartRef.current)
      .append("svg")
      .attr("width", pieWidth)
      .attr("height", pieHeight)
      .append("g")
      .attr("transform", `translate(${pieWidth / 2},${pieHeight / 2})`);

    const pieData = [
      { name: 'Existing Customer', value: totals['Existing Customer'].acv },
      { name: 'New Customer', value: totals['New Customer'].acv }
    ];

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null); // Prevent automatic sorting

    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    // Create pie chart segments
    const segments = pieSvg.selectAll("path")
      .data(pie(pieData))
      .join("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.name))
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    // Add center text
    const centerGroup = pieSvg.append("g");
    
    centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-size", "16px")
      .style("font-weight", "500")
      .text("Total");

    centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("font-size", "16px")
      .style("font-weight", "600")
      .text(`$${(totals['Total'].acv / 1000).toFixed(0)}K`);

    // Add value labels with lines
    const labelLines = pieSvg.selectAll(".label-line")
      .data(pie(pieData))
      .join("g")
      .attr("class", "label-line");

    // Calculate label positions
    const labelPositions = pie(pieData).map(d => {
      const pos = arc.centroid(d);
      const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
      const x = pos[0] * 1.5;
      const y = pos[1] * 1.5;
      
      // Adjust x position based on which half of the pie we're on
      const textAnchor = midAngle < Math.PI ? "start" : "end";
      const labelX = midAngle < Math.PI ? x + 10 : x - 10;
      
      return { x, y, labelX, textAnchor, midAngle };
    });

    // Add lines
    labelLines.append("line")
      .attr("x1", d => arc.centroid(d)[0])
      .attr("y1", d => arc.centroid(d)[1])
      .attr("x2", (d, i) => labelPositions[i].x)
      .attr("y2", (d, i) => labelPositions[i].y)
      .attr("stroke", "#666")
      .attr("stroke-width", 1);

    // Add labels
    labelLines.append("text")
      .attr("x", (d, i) => labelPositions[i].labelX)
      .attr("y", (d, i) => labelPositions[i].y)
      .attr("text-anchor", (d, i) => labelPositions[i].textAnchor)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "14px")
      .style("fill", "#333")
      .text(d => `$${(d.data.value / 1000).toFixed(0)}K (${(d.data.value / totals['Total'].acv * 100).toFixed(0)}%)`);

    // Create table
    if (typeof window !== 'undefined') {
      // Clear any existing table
      d3.select(tableRef.current).selectAll("*").remove();

      // Create table
      const table = d3.select(tableRef.current)
        .append('table')
        .attr('class', styles.table);

      // Create header row
      const thead = table.append('thead');
      const headerRow = thead.append('tr');

      // Add headers
      headerRow.append('th')
        .text('Closed Fiscal Quarter')
        .attr('class', styles.headerCell);

      const quarters = ['2023-Q3', '2023-Q4', '2024-Q1', '2024-Q2', 'Total'];
      quarters.forEach(quarter => {
        headerRow.append('th')
          .attr('colspan', '3')
          .text(quarter)
          .attr('class', quarter === 'Total' ? styles.totalHeaderCell : styles.quarterHeaderCell);
      });

      // Create subheader row
      const subheaderRow = thead.append('tr');
      subheaderRow.append('th')
        .text('Cust Type')
        .attr('class', styles.subHeaderCell);

      // Add subheaders for each quarter
      quarters.forEach(() => {
        ['# of Opps', 'ACV', '% of Total'].forEach(text => {
          subheaderRow.append('th')
            .text(text)
            .attr('class', styles.subHeaderCell)
            .classed(text === '# of Opps' ? styles.centerAlign : styles.rightAlign, true);
        });
      });

      // Create table body
      const tbody = table.append('tbody');

      // Add data rows
      ['Existing Customer', 'New Customer', 'Total'].forEach((type, typeIndex) => {
        const row = tbody.append('tr')
          .attr('class', `${styles.tableRow} ${typeIndex % 2 === 0 ? styles.evenRow : ''} ${type === 'Total' ? styles.totalRow : ''}`);

        // Add customer type
        row.append('td')
          .text(type)
          .attr('class', styles.dataCell);

        // Add data for each quarter
        customerData.forEach(quarter => {
          const data = quarter.rows.find(r => r.type === type);
          row.append('td')
            .text(data.opps)
            .attr('class', `${styles.dataCell} ${styles.centerAlign}`);

          row.append('td')
            .text(`$${data.acv.toLocaleString()}`)
            .attr('class', `${styles.dataCell} ${styles.rightAlign}`);

          row.append('td')
            .text(data.percentage)
            .attr('class', `${styles.dataCell} ${styles.rightAlign}`);
        });

        // Add totals
        const totalData = totals[type];
        row.append('td')
          .text(totalData.opps)
          .attr('class', `${styles.dataCell} ${styles.centerAlign}`);

        row.append('td')
          .text(`$${totalData.acv.toLocaleString()}`)
          .attr('class', `${styles.dataCell} ${styles.rightAlign}`);

        row.append('td')
          .text(totalData.percentage)
          .attr('class', `${styles.dataCell} ${styles.rightAlign}`);
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Customer Data Analysis</title>
        <meta name="description" content="Customer data analysis visualization" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}>
        <main className={styles.main}>
          <h1 className={styles.title}>Won ACV mix by Cust Type</h1>
          <div className={styles.chartsContainer}>
            <div ref={barChartRef} className={styles.barChartContainer}></div>
            <div ref={pieChartRef} className={styles.pieChartContainer}></div>
          </div>
          <div ref={tableRef} className={styles.tableContainer}></div>
        </main>
      </div>
    </>
  );
}
