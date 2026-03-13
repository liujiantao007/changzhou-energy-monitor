// 图表模块

// 全局图表实例
let charts = {};

// 初始化图表
function initCharts() {
    console.log('初始化图表...');
    
    // 检查 echarts 对象是否存在
    if (typeof echarts === 'undefined') {
        console.error('ECharts library not loaded, charts will not be displayed');
        return;
    }
    
    console.log('ECharts库已加载，版本:', echarts.version);
    
    // 初始化用电量分项统计图表
    const electricityChartEl = document.getElementById('electricity-chart');
    if (electricityChartEl) {
        console.log('初始化用电量分项统计图表，容器尺寸:', electricityChartEl.offsetWidth, 'x', electricityChartEl.offsetHeight);
        charts.electricityChart = echarts.init(electricityChartEl);
    } else {
        console.warn('找不到用电量分项统计图表容器');
    }
    
    // 初始化POI分项统计图表
    if (document.getElementById('poi-chart')) {
        charts.poiChart = echarts.init(document.getElementById('poi-chart'));
    }
    
    // 初始化用电类型统计图表
    if (document.getElementById('electricity-type-chart')) {
        charts.electricityTypeChart = echarts.init(document.getElementById('electricity-type-chart'));
    }
    
    // 初始化能耗趋势图
    if (document.getElementById('energy-trend-chart')) {
        charts.energyTrendChart = echarts.init(document.getElementById('energy-trend-chart'));
    }
    
    console.log('图表初始化完成，实例数量:', Object.keys(charts).length);
    
    // 窗口大小变化时重新调整图表大小
    window.addEventListener('resize', function() {
        Object.values(charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    });
}

// 更新用电量分项统计图表
function updateElectricityChart(data) {
    console.log('更新用电量分项统计图表...');
    
    if (!charts.electricityChart) {
        console.error('用电量分项统计图表实例不存在');
        return;
    }
    
    const energyData = data.energyData || [];
    console.log('用电量分项统计数据条数:', energyData.length);
    
    // 按"用电属性"列（I列）分类统计"度数"列数据
    const typeData = {};
    energyData.forEach(item => {
        // 使用用电属性列（I列）作为分类
        const type = item['I'] || item['i'] || item['用电属性'] || '其他';
        const value = Number(item['AB'] || item['ab'] || item['度数'] || 0) || 0;
        
        if (typeData[type]) {
            typeData[type] += value;
        } else {
            typeData[type] = value;
        }
    });
    
    // 转换为饼图数据格式
    const chartData = Object.entries(typeData).map(([name, value]) => ({
        name,
        value: Math.floor(value)  // 取整，移除小数部分
    }));
    
    console.log('用电量分项统计数据:', chartData);
    
    if (chartData.length === 0) {
        console.warn('没有数据用于饼图显示');
        return;
    }
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                return params.name + ': ' + params.value.toLocaleString('zh-CN') + ' kWh (' + params.percent + '%)';
            },
            textStyle: {
                fontSize: 14
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'center',
            textStyle: {
                fontSize: 14,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
            }
        },
        series: [{
            name: '用电量',
            type: 'pie',
            radius: '55%',
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            minShowLabelAngle: 0,
            itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: true,
                formatter: function(params) {
                    return params.name + '\n' + params.value.toLocaleString('zh-CN') + ' kWh\n(' + params.percent + '%)';
                },
                fontSize: 12,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                position: 'outside'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            labelLine: {
                show: true,
                length: 5,
                length2: 5
            },
            data: chartData,
            color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
        }]
    };
    
    charts.electricityChart.setOption(option);
    console.log('用电量分项统计图表配置已设置');
}

// 更新POI分项统计图表
function updatePoiChart(data) {
    console.log('更新POI分项统计图表...');
    
    if (!charts.poiChart) {
        console.error('POI分项统计图表实例不存在');
        return;
    }
    
    const energyData = data.energyData || [];
    console.log('POI分项统计数据条数:', energyData.length);
    
    // 打印前几条数据的用电属性和POI名称
    console.log('前5条数据样例:');
    for (let i = 0; i < Math.min(5, energyData.length); i++) {
        console.log(`  第${i+1}条 - 用电属性(I): "${energyData[i]['I']}", POI名称(L): "${energyData[i]['L']}"`);
    }
    
    // 按用电属性列（I列）分类统计POI名称列（L列）去重数量
    const poiDataByAttr = {};
    
    energyData.forEach(item => {
        // 使用用电属性列（I列）作为分类
        const attr = item['I'] || item['i'] || item['用电属性'] || '其他';
        // 使用POI名称列（L列）
        const poiName = item['L'] || item['l'] || item['poi名称'] || '';
        
        if (poiName) {
            if (!poiDataByAttr[attr]) {
                poiDataByAttr[attr] = new Set();
            }
            poiDataByAttr[attr].add(poiName);
        }
    });
    
    // 打印每个用电属性的POI集合
    console.log('各用电属性的POI集合:');
    Object.entries(poiDataByAttr).forEach(([attr, poiSet]) => {
        console.log(`  ${attr}: ${poiSet.size}个POI`, Array.from(poiSet).slice(0, 3));
    });
    
    // 转换为饼图数据格式
    const chartData = Object.entries(poiDataByAttr).map(([name, poiSet]) => ({
        name,
        value: poiSet.size
    }));
    
    console.log('POI分项统计图表数据:', chartData);
    
    if (chartData.length === 0) {
        console.warn('没有数据用于POI饼图显示');
        return;
    }
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                return params.name + ': ' + params.value.toLocaleString('zh-CN') + ' 个 (' + params.percent + '%)';
            },
            textStyle: {
                fontSize: 14
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'center',
            textStyle: {
                fontSize: 14,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
            }
        },
        series: [{
            name: 'POI 数量',
            type: 'pie',
            radius: '50%',
            center: ['55%', '50%'],
            avoidLabelOverlap: true,
            minShowLabelAngle: 0,
            itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: true,
                formatter: function(params) {
                    return params.name + '\n' + params.value.toLocaleString('zh-CN') + ' 个\n(' + params.percent + '%)';
                },
                fontSize: 12,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                position: 'outside'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            labelLine: {
                show: true,
                length: 5,
                length2: 5
            },
            data: chartData,
            color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
        }]
    };
    
    charts.poiChart.setOption(option);
    console.log('POI分项统计图表配置已设置');
}

// 更新用电类型统计图表（两层嵌套环形图）
function updateElectricityTypeChart(data) {
    console.log('更新用电类型统计图表...');
    
    if (!charts.electricityTypeChart) {
        console.error('用电类型统计图表实例不存在');
        return;
    }
    
    const energyData = data.energyData || [];
    console.log('用电类型统计数据条数:', energyData.length);
    
    // 按用电类型列（K 列）分类统计度数和电费
    const typeData = {};
    energyData.forEach(item => {
        const type = item['K'] || item['k'] || item['用电类型'] || '其他';
        const energy = Number(item['AB'] || item['ab'] || 0) || 0;
        const cost = Number(item['AC'] || item['ac'] || 0) || 0;
        
        if (!typeData[type]) {
            typeData[type] = { energy: 0, cost: 0 };
        }
        typeData[type].energy += energy;
        typeData[type].cost += cost;
    });
    
    // 转换为图表数据格式
    const energyDataArray = Object.entries(typeData).map(([name, data]) => ({
        name,
        value: Math.floor(data.energy)
    }));
    
    const costDataArray = Object.entries(typeData).map(([name, data]) => ({
        name,
        value: Math.floor(data.cost)
    }));
    
    console.log('用电类型统计 - 电量数据:', energyDataArray);
    console.log('用电类型统计 - 电费数据:', costDataArray);
    
    if (energyDataArray.length === 0) {
        console.warn('没有数据用于用电类型图表显示');
        return;
    }
    
    // 外层圆环图颜色（蓝色系）
    const outerColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
    // 内层饼状图颜色（紫色/粉色系）
    const innerColors = ['#8b5cf6', '#ec4899', '#f472b6', '#fb7185', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const value = params.seriesName === '电量' 
                    ? params.value.toLocaleString('zh-CN') + ' kWh'
                    : params.value.toLocaleString('zh-CN') + ' 元';
                return params.seriesName + '<br/>' + params.name + ': ' + value;
            },
            textStyle: {
                fontSize: 14
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'center',
            textStyle: {
                fontSize: 14,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
            }
        },
        series: [
            {
                name: '电量',
                type: 'pie',
                radius: ['50%', '70%'],
                center: ['50%', '50%'],
                data: energyDataArray,
                label: {
                    show: true,
                    formatter: '{b}\n{c}',
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                    }
                },
                labelLine: {
                    show: true,
                    length: 8,
                    length2: 8
                },
                color: outerColors
            },
            {
                name: '电费',
                type: 'pie',
                radius: ['0%', '40%'],
                center: ['50%', '50%'],
                data: costDataArray,
                label: {
                    show: true,
                    formatter: function(params) {
                        return params.value.toLocaleString('zh-CN') + '元';
                    },
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#fff',
                    borderWidth: 1
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 11,
                        fontWeight: 'bold',
                        fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                    }
                },
                color: innerColors
            }
        ]
    };
    
    charts.electricityTypeChart.setOption(option);
    console.log('用电类型统计图表配置已设置');
}

// 更新能耗趋势图
function updateEnergyTrendChart(data) {
    if (!charts.energyTrendChart) return;
    
    // 使用原始数据，不受时间选择器影响
    const rawData = data.rawData || [];
    console.log('能耗趋势图原始数据条数:', rawData.length);
    
    // 获取最近12个月的数据
    const monthlyData = {};
    rawData.forEach(item => {
        const dateStr = item['A'] || '';
        const dateObj = parseDate(dateStr);
        if (dateObj) {
            const yearMonth = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}`;
            if (!monthlyData[yearMonth]) {
                monthlyData[yearMonth] = { energy: 0, cost: 0 };
            }
            monthlyData[yearMonth].energy += Number(item['AB'] || item['ab'] || 0) || 0;
            monthlyData[yearMonth].cost += Number(item['AC'] || item['ac'] || 0) || 0;
        }
    });
    
    // 生成最近12个月的月份列表
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${date.getFullYear()}/${date.getMonth() + 1}`);
    }
    
    // 构建图表数据
    const energyValues = months.map(month => {
        const data = monthlyData[month];
        return data ? Math.floor(data.energy) : 0;
    });
    
    const costValues = months.map(month => {
        const data = monthlyData[month];
        return data ? Math.floor(data.cost) : 0;
    });
    
    console.log('能耗趋势图月份:', months);
    console.log('能耗趋势图能耗数据:', energyValues);
    console.log('能耗趋势图电费数据:', costValues);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            textStyle: {
                fontSize: 14
            },
            formatter: function(params) {
                let result = params[0].axisValue + '<br/>';
                params.forEach(param => {
                    const unit = param.seriesName === '能耗' ? ' kWh' : ' 元';
                    result += param.marker + param.seriesName + ': ' + param.value.toLocaleString('zh-CN') + unit + '<br/>';
                });
                return result;
            }
        },
        legend: {
            data: ['能耗', '电费'],
            top: 5,
            textStyle: {
                fontSize: 14,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: months.map(m => m.split('/')[1] + '月'),
            axisLabel: {
                fontSize: 12,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '能耗 (kWh)',
                position: 'left',
                axisLabel: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    formatter: function(value) {
                        return value.toLocaleString('zh-CN');
                    }
                },
                nameTextStyle: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                }
            },
            {
                type: 'value',
                name: '电费 (元)',
                position: 'right',
                axisLabel: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    formatter: function(value) {
                        return value.toLocaleString('zh-CN');
                    }
                },
                nameTextStyle: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                }
            }
        ],
        series: [
            {
                name: '能耗',
                type: 'line',
                yAxisIndex: 0,
                data: energyValues,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    color: '#5470c6',
                    width: 2
                },
                itemStyle: {
                    color: '#5470c6'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                            { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
                        ]
                    }
                }
            },
            {
                name: '电费',
                type: 'line',
                yAxisIndex: 1,
                data: costValues,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    color: '#ee6666',
                    width: 2
                },
                itemStyle: {
                    color: '#ee6666'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(238, 102, 102, 0.3)' },
                            { offset: 1, color: 'rgba(238, 102, 102, 0.05)' }
                        ]
                    }
                }
            }
        ]
    };
    
    charts.energyTrendChart.setOption(option);
    console.log('能耗趋势图配置已设置');
}

// 导出图表函数
window.initCharts = initCharts;
window.updateElectricityChart = updateElectricityChart;
window.updatePoiChart = updatePoiChart;
window.updateElectricityTypeChart = updateElectricityTypeChart;
window.updateEnergyTrendChart = updateEnergyTrendChart;