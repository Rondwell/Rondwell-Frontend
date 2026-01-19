<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revenue Chart</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        
        body {
            background-color: #f9fafb;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .chart-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 30px;
            max-width: 800px;
            width: 100%;
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
        }
        
        .revenue-info h2 {
            font-size: 14px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .revenue-amount {
            font-size: 36px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .revenue-change {
            display: flex;
            align-items: center;
            color: #10b981;
            font-weight: 600;
            font-size: 16px;
        }
        
        .revenue-change::before {
            content: "↑";
            margin-right: 4px;
        }
        
        .chart-wrapper {
            position: relative;
            height: 300px;
        }
        
        .y-axis-label {
            position: absolute;
            left: -40px;
            top: 50%;
            transform: rotate(-90deg);
            transform-origin: center;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
        }
        
        .y-axis-values {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 10px 0;
            color: #6b7280;
            font-size: 12px;
            font-weight: 500;
        }
        
        .grid-line {
            position: absolute;
            left: 50px;
            right: 0;
            height: 1px;
            background-color: #f3f4f6;
        }
        
        .chart-svg {
            width: 100%;
            height: 100%;
            margin-left: 50px;
        }
        
        .x-axis {
            display: flex;
            justify-content: space-between;
            margin-left: 50px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
        }
        
        .month-label {
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .tooltip {
            position: absolute;
            background: rgba(17, 24, 39, 0.95);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10;
        }
        
        .tooltip:after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 5px 5px 0 5px;
            border-style: solid;
            border-color: rgba(17, 24, 39, 0.95) transparent transparent transparent;
        }
        
        .data-point {
            cursor: pointer;
            transition: r 0.2s;
        }
        
        .data-point:hover {
            r: 6;
        }
        
        .area-gradient {
            opacity: 0.3;
        }
        
        .month-markers {
            display: flex;
            justify-content: space-between;
            margin-left: 50px;
            margin-top: 5px;
        }
        
        .month-marker {
            width: 1px;
            height: 5px;
            background-color: #d1d5db;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <div class="chart-header">
            <div class="revenue-info">
                <h2>Total Revenue</h2>
                <div class="revenue-amount">$96,000.00</div>
                <div class="revenue-change">+5%</div>
            </div>
        </div>
        
        <div class="chart-wrapper">
            <div class="y-axis-label">Amount ($)</div>
            
            <div class="y-axis-values">
                <span>20k</span>
                <span>15k</span>
                <span>10k</span>
                <span>5k</span>
                <span>0</span>
            </div>
            
            <!-- Grid Lines -->
            <div class="grid-line" style="top: 0;"></div>
            <div class="grid-line" style="top: 25%;"></div>
            <div class="grid-line" style="top: 50%;"></div>
            <div class="grid-line" style="top: 75%;"></div>
            <div class="grid-line" style="bottom: 0;"></div>
            
            <!-- SVG Chart Container -->
            <svg class="chart-svg"></svg>
            
            <!-- Tooltip -->
            <div class="tooltip"></div>
        </div>
        
        <!-- Month Markers -->
        <div class="month-markers">
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
            <div class="month-marker"></div>
        </div>
        
        <!-- X-Axis Labels -->
        <div class="x-axis">
            <span class="month-label">J</span>
            <span class="month-label">F</span>
            <span class="month-label">M</span>
            <span class="month-label">A</span>
            <span class="month-label">M</span>
            <span class="month-label">J</span>
            <span class="month-label">J</span>
            <span class="month-label">A</span>
            <span class="month-label">S</span>
            <span class="month-label">O</span>
            <span class="month-label">N</span>
            <span class="month-label">D</span>
        </div>
    </div>

    <script>
        // Sample revenue data for 12 months
        const revenueData = [
            { month: 'J', revenue: 8500 },
            { month: 'F', revenue: 9200 },
            { month: 'M', revenue: 11200 },
            { month: 'A', revenue: 13500 },
            { month: 'M', revenue: 14200 },
            { month: 'J', revenue: 15800 },
            { month: 'J', revenue: 17300 },
            { month: 'A', revenue: 16500 },
            { month: 'S', revenue: 18900 },
            { month: 'O', revenue: 21000 },
            { month: 'N', revenue: 19500 },
            { month: 'D', revenue: 22800 }
        ];
        
        // Chart dimensions
        const margin = { top: 20, right: 20, bottom: 30, left: 0 };
        const width = 700;
        const height = 300;
        
        // Create SVG
        const svg = d3.select('.chart-svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        // Scales
        const xScale = d3.scalePoint()
            .domain(revenueData.map(d => d.month))
            .range([0, width])
            .padding(0.5);
        
        const yScale = d3.scaleLinear()
            .domain([0, 20000])
            .range([height, 0]);
        
        // Line generator
        const line = d3.line()
            .x(d => xScale(d.month))
            .y(d => yScale(d.revenue))
            .curve(d3.curveMonotoneX);
        
        // Area generator
        const area = d3.area()
            .x(d => xScale(d.month))
            .y0(height)
            .y1(d => yScale(d.revenue))
            .curve(d3.curveMonotoneX);
        
        // Create gradient for area fill
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.3);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0);
        
        // Draw area
        svg.append('path')
            .datum(revenueData)
            .attr('class', 'area-gradient')
            .attr('d', area)
            .attr('fill', 'url(#area-gradient)');
        
        // Draw line
        svg.append('path')
            .datum(revenueData)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 3)
            .attr('d', line);
        
        // Draw data points
        const points = svg.selectAll('.data-point')
            .data(revenueData)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.month))
            .attr('cy', d => yScale(d.revenue))
            .attr('r', 4)
            .attr('fill', '#3b82f6')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        
        // Tooltip functionality
        const tooltip = d3.select('.tooltip');
        
        points.on('mouseover', function(event, d) {
            // Highlight point
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 6)
                .attr('fill', '#1d4ed8');
            
            // Show tooltip
            tooltip
                .style('opacity', 1)
                .html(`
                    <div style="font-weight: 600; margin-bottom: 4px;">${d.month} Month</div>
                    <div>Revenue: <strong>$${d.revenue.toLocaleString()}</strong></div>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 70) + 'px');
            
            // Draw value line
            svg.append('line')
                .attr('class', 'value-line')
                .attr('x1', xScale(d.month))
                .attr('y1', yScale(d.revenue))
                .attr('x2', xScale(d.month))
                .attr('y2', height)
                .attr('stroke', '#d1d5db')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4,4');
        })
        .on('mouseout', function(event, d) {
            // Reset point
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 4)
                .attr('fill', '#3b82f6');
            
            // Hide tooltip
            tooltip.style('opacity', 0);
            
            // Remove value line
            svg.select('.value-line').remove();
        });
        
        // Add month markers to match the design
        revenueData.forEach(d => {
            svg.append('line')
                .attr('x1', xScale(d.month))
                .attr('y1', height)
                .attr('x2', xScale(d.month))
                .attr('y2', height + 5)
                .attr('stroke', '#d1d5db')
                .attr('stroke-width', 1);
        });
        
        // Add current month highlight (December in this case)
        const currentMonth = 'D';
        const currentIndex = revenueData.findIndex(d => d.month === currentMonth);
        
        if (currentIndex !== -1) {
            const currentData = revenueData[currentIndex];
            
            // Highlight point
            svg.append('circle')
                .attr('cx', xScale(currentData.month))
                .attr('cy', yScale(currentData.revenue))
                .attr('r', 6)
                .attr('fill', 'white')
                .attr('stroke', '#3b82f6')
                .attr('stroke-width', 3);
            
            // Add annotation
            svg.append('text')
                .attr('x', xScale(currentData.month))
                .attr('y', yScale(currentData.revenue) - 15)
                .attr('text-anchor', 'middle')
                .attr('fill', '#3b82f6')
                .attr('font-weight', '600')
                .attr('font-size', '12px')
                .text(`$${currentData.revenue.toLocaleString()}`);
        }
        
        // Calculate and display total
        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
        console.log('Total Revenue:', totalRevenue);
        
        // Add interactivity to show values on hover
        svg.on('mousemove', function(event) {
            const [x] = d3.pointer(event);
            const monthIndex = Math.round((x / width) * (revenueData.length - 1));
            
            if (monthIndex >= 0 && monthIndex < revenueData.length) {
                const dataPoint = revenueData[monthIndex];
                
                // Update tooltip position
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 70) + 'px');
            }
        });
    </script>
</body>
</html>