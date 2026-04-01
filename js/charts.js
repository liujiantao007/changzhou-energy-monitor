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

    // 初始化用电方分类饼图（移动/铁塔）
    if (document.getElementById('consumer-type-chart')) {
        charts.consumerTypeChart = echarts.init(document.getElementById('consumer-type-chart'));
        console.log('初始化用电方分类饼图');
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
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 0,
            shadowBlur: 0,
            padding: [0, 0, 0, 0],
            extraCssText: 'box-shadow: none; border: none; background: transparent !important;',
            textStyle: {
                fontSize: 14,
                color: '#fff'
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'center',
            textStyle: {
                fontSize: 14,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                color: '#fff'
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
                borderRadius: 8
            },
            label: {
                show: true,
                formatter: function(params) {
                    return params.name + '\n' + params.value.toLocaleString('zh-CN') + ' kWh\n(' + params.percent + '%)';
                },
                fontSize: 12,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                position: 'outside',
                color: '#fff',
                textBorderColor: 'transparent',
                textBorderWidth: 0
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

// 更新 POI 分项统计图表
function updatePoiChart(data) {
    console.log('更新 POI 分项统计图表...');

    if (!charts.poiChart) {
        console.error('POI 分项统计图表实例不存在');
        return;
    }

    const energyData = data.energyData || [];
    console.log('POI 分项统计数据条数:', energyData.length);

    // 汇总 tower_poi_count 和 mobile_poi_count 数据
    let mobilePoi = 0;
    let towerPoi = 0;

    energyData.forEach(item => {
        mobilePoi += Number(item.mobile_poi_count || 0) || 0;
        towerPoi += Number(item.tower_poi_count || 0) || 0;
    });

    const chartData = [
        { name: '移动', value: mobilePoi },
        { name: '铁塔', value: towerPoi }
    ];

    const total = mobilePoi + towerPoi;
    console.log('POI 分项统计数据 - 移动:', mobilePoi, '个，铁塔:', towerPoi, '个，总计:', total, '个');

    if (total === 0) {
        console.warn('没有 POI 数据用于饼图显示');
        charts.poiChart.setOption({
            title: {
                text: '暂无数据',
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#999',
                    fontSize: 14,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                }
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                data: [],
                label: { show: false }
            }]
        });
        return;
    }

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const value = params.value.toLocaleString('zh-CN');
                const percent = params.percent.toFixed(1);
                return `<div style="font-family: Microsoft YaHei, SimHei, sans-serif; font-size: 12px; color: #fff; background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
                    <div>POI 数量：${value} 个</div>
                    <div>占比：${percent}%</div>
                </div>`;
            },
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            extraCssText: 'box-shadow: none; border: none;'
        },
        legend: {
            orient: 'vertical',
            right: '1%',
            top: '1%',
            textStyle: {
                fontSize: 13,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                color: '#fff'
            },
            formatter: function(name) {
                const data = chartData.find(d => d.name === name);
                const value = data ? data.value.toLocaleString('zh-CN') : '0';
                const percent = total > 0 && data ? ((data.value / total) * 100).toFixed(1) : '0.0';
                return `${name}: ${value} 个 (${percent}%)`;
            },
            itemWidth: 15,
            itemHeight: 15,
            itemGap: 12
        },
        series: [{
            name: 'POI 分类',
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['28%', '50%'],
            avoidLabelOverlap: true,
            minShowLabelAngle: 5,
            label: {
                show: true,
                formatter: function(params) {
                    const percent = params.percent != null ? params.percent.toFixed(1) : '0.0';
                    return `${params.name}\n${percent}%`;
                },
                fontSize: 12,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                fontWeight: 'bold',
                position: 'outside',
                color: '#fff',
                textShadowBlur: 2,
                textShadowColor: 'rgba(0,0,0,0.5)'
            },
            labelLine: {
                show: true,
                length: 6,
                length2: 8,
                lineStyle: {
                    color: 'rgba(255,255,255,0.6)',
                    width: 1
                }
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 16,
                    fontWeight: 'bold',
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                itemStyle: {
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            data: chartData,
            color: ['#5470c6', '#ee6666']
        }]
    };

    charts.poiChart.setOption(option, true);
    console.log('POI 分项统计图表配置已设置');
}

// 更新用电类型统计图表（双环：外环能耗，内环电费）
function updateElectricityTypeChart(data) {
    console.log('更新用电类型统计图表...');

    // 定义颜色系 (在此处统一管理，方便后续修改)
    // ==========================================
    const colors = {
        // 外环 - 能耗 (冷色/警示系)
        energy: [
            '#1565C0', // 直供电 - 深蓝
            '#C62828'  // 转供电 - 深红
        ],
        // 内环 - 电费 (暖色/财富系)
        cost: [
            '#2E7D32', // 直供电 - 深绿
            '#F9A825'  // 转供电 - 琥珀黄
        ]
    };

    if (!charts.electricityTypeChart) {
        console.error('用电类型统计图表实例不存在');
        return;
    }

    const energyData = data.energyData || [];
    console.log('用电类型统计数据条数:', energyData.length);

    // 汇总直供电和转供电的能耗和电费
    let directEnergy = 0;
    let directCost = 0;
    let indirectEnergy = 0;
    let indirectCost = 0;

    energyData.forEach(item => {
        directEnergy += Number(item.direct_power_supply_energy || 0) || 0;
        directCost += Number(item.direct_power_supply_cost || 0) || 0;
        indirectEnergy += Number(item.indirect_power_supply_energy || 0) || 0;
        indirectCost += Number(item.indirect_power_supply_cost || 0) || 0;
    });

    const energyDataArray = [
        { name: '直供电', value: Math.floor(directEnergy), itemStyle: { color: '#1565C0' } },
        { name: '转供电', value: Math.floor(indirectEnergy), itemStyle: { color: '#C62828' } }
    ];

    const costDataArray = [
        { name: '直供电', value: Math.floor(directCost), itemStyle: { color: '#2E7D32' } },
        { name: '转供电', value: Math.floor(indirectCost), itemStyle: { color: '#F9A825' } }
    ];

    const totalEnergy = directEnergy + indirectEnergy;
    const totalCost = directCost + indirectCost;
    console.log('用电类型统计 - 直供电:', directEnergy.toFixed(2), 'kWh,', directCost.toFixed(2), '元');
    console.log('用电类型统计 - 转供电:', indirectEnergy.toFixed(2), 'kWh,', indirectCost.toFixed(2), '元');

    if (totalEnergy === 0) {
        console.warn('没有用电类型数据用于图表显示');
        charts.electricityTypeChart.setOption({
            title: {
                text: '暂无数据',
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#999',
                    fontSize: 14,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                }
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                data: [],
                label: { show: false }
            }]
        });
        return;
    }

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const value = params.value.toLocaleString('zh-CN');
                const unit = params.seriesName === '能耗' ? 'kWh' : '元';
                const percent = params.percent.toFixed(1);
                return `<div style="font-family: Microsoft YaHei, SimHei, sans-serif; font-size: 12px; color: #fff; background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${params.seriesName} - ${params.name}</div>
                    <div>数值：${value} ${unit}</div>
                    <div>占比：${percent}%</div>
                </div>`;
            },
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            extraCssText: 'box-shadow: none; border: none;'
        },
        // 富文本样式定义
        textStyle: {
            rich: {
                energyTitle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#90cdf4',
                    padding: [0, 0, 4, 0],
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                costTitle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#f6ad55',
                    padding: [0, 0, 4, 0],
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                }
            }
        },
        legend: [
            {
                // 外环图例（能耗）
                orient: 'vertical',
                right: '1%',
                top: '1%',
                textStyle: {
                    fontSize: 13,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff'
                },
                formatter: function(name) {
                    const energyData = energyDataArray.find(d => d.name === name);
                    const energy = energyData ? energyData.value.toLocaleString('zh-CN') : '0';
                    const energyPercent = totalEnergy > 0 ? ((energyData.value / totalEnergy) * 100).toFixed(1) : '0.0';
                    return `{energyTitle|能耗}  ${name}: ${energy} kWh (${energyPercent}%)`;
                },
                itemWidth: 15,
                itemHeight: 15,
                itemGap: 12,
                icon: 'roundRect',
                data: [
                    { name: '直供电', icon: 'roundRect', itemStyle: { color: '#1565C0' } },
                    { name: '转供电', icon: 'roundRect', itemStyle: { color: '#C62828' } }
                ]
            },
            {
                // 内环图例（电费）
                orient: 'vertical',
                right: '1%',
                top: '35%',
                textStyle: {
                    fontSize: 13,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff'
                },
                formatter: function(name) {
                    const costData = costDataArray.find(d => d.name === name);
                    const cost = costData ? costData.value.toLocaleString('zh-CN') : '0';
                    const costPercent = totalCost > 0 ? ((costData.value / totalCost) * 100).toFixed(1) : '0.0';
                    return `{costTitle|电费}  ${name}: ${cost}元 (${costPercent}%)`;
                },
                itemWidth: 15,
                itemHeight: 15,
                itemGap: 12,
                icon: 'roundRect',
                data: [
                    { name: '直供电', icon: 'roundRect', itemStyle: { color: '#2E7D32' } },
                    { name: '转供电', icon: 'roundRect', itemStyle: { color: '#F9A825' } }
                ]
            }
        ],
        series: [
            {
                name: '能耗',
                type: 'pie',
                radius: ['50%', '70%'],
                center: ['28%', '50%'],
                avoidLabelOverlap: false,
                minShowLabelAngle: 0,
                label: {
                    show: true,
                    formatter: function(params) {
                        const percent = params.percent != null ? params.percent.toFixed(1) : '0.0';
                        return `${params.name}\n${percent}%`;
                    },
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    fontWeight: 'bold',
                    position: 'outside',
                    color: '#fff',
                    textShadowBlur: 2,
                    textShadowColor: 'rgba(0,0,0,0.5)'
                },
                labelLine: {
                    show: true,
                    length: 10,
                    length2: 15,
                    lineStyle: {
                        color: 'rgba(255,255,255,0.6)',
                        width: 1
                    }
                },
                labelLayout: {
                    hideOverlap: false
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold',
                        fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                data: energyDataArray
            },
            {
                name: '电费',
                type: 'pie',
                radius: ['0%', '35%'],
                center: ['28%', '50%'],
                avoidLabelOverlap: true,
                minShowLabelAngle: 0,
                label: {
                    show: true,
                    overflow: 'none',
                    textOverflow: 'none',
                    lineHeight: 18,
                    formatter: function(params) {
                        const value = params.value.toLocaleString('zh-CN');
                        return `${params.name}\n${value}元`;
                    },
                    fontSize: 11,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    fontWeight: 'bold',
                    position: 'inside',
                    color: '#fff',
                    textShadowBlur: 2,
                    textShadowColor: 'rgba(0,0,0,0.5)'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                data: costDataArray
            }
        ]
    };

    // 清除旧配置，避免合并
    charts.electricityTypeChart.clear();
    charts.electricityTypeChart.setOption(option, {
        notMerge: true
    });
    console.log('用电类型统计图表配置已设置');
    console.log('外环颜色 (能耗):', ['#1565C0', '#C62828']);
    console.log('内环颜色 (电费):', ['#2E7D32', '#F9A825']);
}

// 更新能耗趋势图
let currentTrendTimeType = '日';  // 默认日维度

function updateEnergyTrendChart(data, timeType) {
    if (!charts.energyTrendChart) return;
    
    // 使用传入的时间类型，或使用当前保存的类型
    if (timeType) {
        currentTrendTimeType = timeType;
    }

    // 使用原始完整数据，不受时间选择器影响
    // 根据时间维度选择不同的数据源
    let rawData = [];
    
    // 日视图：优先使用 window.originalDataCache（首次加载的60天数据）
    // 月视图/年视图：优先使用传入的 data.rawData（12个月/12年数据）
    if (currentTrendTimeType === '日') {
        // 日视图：优先使用原始完整数据缓存
        if (window.originalDataCache && window.originalDataCache.length > 0) {
            rawData = window.originalDataCache;
            console.log('日视图：使用原始完整数据缓存，条数:', rawData.length);
        } else if (data.rawData && data.rawData.length > 0) {
            rawData = data.rawData;
            console.log('日视图：使用传入的原始数据，条数:', rawData.length);
        } else if (window.rawDataCache && window.rawDataCache.length > 0) {
            rawData = window.rawDataCache;
            console.log('日视图：使用当前数据缓存，条数:', rawData.length);
        }
    } else {
        // 月视图/年视图：优先使用传入的数据（包含完整的时间范围）
        if (data.rawData && data.rawData.length > 0) {
            rawData = data.rawData;
            console.log(currentTrendTimeType + '视图：使用传入的原始数据，条数:', rawData.length);
        } else if (window.rawDataCache && window.rawDataCache.length > 0) {
            rawData = window.rawDataCache;
            console.log(currentTrendTimeType + '视图：使用当前数据缓存，条数:', rawData.length);
        } else if (window.originalDataCache && window.originalDataCache.length > 0) {
            rawData = window.originalDataCache;
            console.log(currentTrendTimeType + '视图：使用原始完整数据缓存，条数:', rawData.length);
        }
    }

    let latestDate = data.latestDate;
    if (!latestDate && window.latestDate) {
        latestDate = window.latestDate;
    }

    console.log('能耗趋势图接收数据 - rawData 条数:', rawData.length, '时间维度:', currentTrendTimeType, '最新日期:', latestDate);
    if (rawData.length > 0 && rawData.length <= 10) {
        console.log('能耗趋势图原始数据内容:', rawData.map(item => ({ date: item['A'], energy: item['AB'], cost: item['AC'] })));
    }

    let labels = [];
    let energyValues = [];
    let costValues = [];

    if (currentTrendTimeType === '日') {
        // 日维度：最近30天（以数据库最新日期为准）
        const dailyData = {};
        rawData.forEach(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            if (dateObj) {
                const dateKey = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = { energy: 0, cost: 0 };
                }
                dailyData[dateKey].energy += Number(item['AB'] || item['ab'] || 0) || 0;
                dailyData[dateKey].cost += Number(item['AC'] || item['ac'] || 0) || 0;
            }
        });
        
        // 以数据库最新日期为准，生成最近30天的日期列表
        const days = [];
        let baseDate;
        if (latestDate) {
            baseDate = parseDate(latestDate);
        }
        if (!baseDate) {
            baseDate = new Date();
        }
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
            days.push(`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
        }
        
        labels = days.map(d => {
            const parts = d.split('/');
            return parts[1] + '/' + parts[2];
        });
        energyValues = days.map(day => {
            const data = dailyData[day];
            return data ? Math.floor(data.energy) : 0;
        });
        costValues = days.map(day => {
            const data = dailyData[day];
            return data ? Math.floor(data.cost) : 0;
        });
        
    } else if (currentTrendTimeType === '月') {
        // 月维度：最近12个月
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
        
        // 以数据库最新日期为准，生成最近12个月的月份列表
        let baseDate;
        if (latestDate) {
            baseDate = parseDate(latestDate);
        }
        if (!baseDate) {
            baseDate = new Date();
        }
        
        const months = [];
        for (let i = 11; i >= 0; i--) {
            // 正确计算月份，避免负数月份导致的年份调整
            let year = baseDate.getFullYear();
            let month = baseDate.getMonth() - i;
            while (month < 0) {
                year--;
                month += 12;
            }
            months.push(`${year}/${month + 1}`);
        }
        
        labels = months.map(m => m.split('/')[1] + '月');
        energyValues = months.map(month => {
            const data = monthlyData[month];
            return data ? Math.floor(data.energy) : 0;
        });
        costValues = months.map(month => {
            const data = monthlyData[month];
            return data ? Math.floor(data.cost) : 0;
        });
        
    } else if (currentTrendTimeType === '年') {
        // 年维度：最近12年
        const yearlyData = {};
        rawData.forEach(item => {
            const dateStr = item['A'] || '';
            const dateObj = parseDate(dateStr);
            if (dateObj) {
                const year = dateObj.getFullYear();
                if (!yearlyData[year]) {
                    yearlyData[year] = { energy: 0, cost: 0 };
                }
                yearlyData[year].energy += Number(item['AB'] || item['ab'] || 0) || 0;
                yearlyData[year].cost += Number(item['AC'] || item['ac'] || 0) || 0;
            }
        });
        
        // 以数据库最新日期为准，生成最近12年的年份列表
        let baseDate;
        if (latestDate) {
            baseDate = parseDate(latestDate);
        }
        if (!baseDate) {
            baseDate = new Date();
        }
        
        const years = [];
        for (let i = 11; i >= 0; i--) {
            years.push(baseDate.getFullYear() - i);
        }
        
        labels = years.map(y => y + '年');
        energyValues = years.map(year => {
            const data = yearlyData[year];
            return data ? Math.floor(data.energy) : 0;
        });
        costValues = years.map(year => {
            const data = yearlyData[year];
            return data ? Math.floor(data.cost) : 0;
        });
    }
    
    console.log('能耗趋势图标签:', labels);
    console.log('能耗趋势图能耗数据:', energyValues);
    console.log('能耗趋势图电费数据:', costValues);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 0,
            shadowBlur: 0,
            padding: [0, 0, 0, 0],
            extraCssText: 'box-shadow: none; border: none; background: transparent !important;',
            textStyle: {
                fontSize: 14,
                color: '#fff'
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
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                color: '#fff'
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
            data: labels,
            axisLabel: {
                fontSize: 12,
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                color: '#fff'
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
                    color: '#fff',
                    formatter: function(value) {
                        return value.toLocaleString('zh-CN');
                    }
                },
                nameTextStyle: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            {
                type: 'value',
                name: '电费 (元)',
                position: 'right',
                axisLabel: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff',
                    formatter: function(value) {
                        return value.toLocaleString('zh-CN');
                    }
                },
                nameTextStyle: {
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff'
                },
                splitLine: {
                    show: false
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

// 获取当前能耗趋势图的时间维度
function getCurrentTrendTimeType() {
    return currentTrendTimeType;
}

// 更新用电方分类饼图（双环：外环能耗，内环电费）
function updateConsumerTypeChart(data) {
    console.log('更新用电方分类饼图...');

    if (!charts.consumerTypeChart) {
        console.error('用电方分类饼图实例不存在');
        return;
    }

    // 定义颜色系 (在此处统一管理，方便后续修改)
    // ==========================================
    const colors = {
        // 外环 - 能耗 (保持现有颜色)
        energy: [
            '#5470c6', // 移动 - 蓝色
            '#ee6666'  // 铁塔 - 红色
        ],
        // 内环 - 电费 (使用不同色系以区分)
        fee: [
            '#2E7D32', // 移动 - 深绿
            '#F9A825'  // 铁塔 - 琥珀黄
        ]
    };

    const energyData = data.energyData || [];
    console.log('用电方分类数据条数:', energyData.length);

    // 从数据中汇总移动和铁塔的能耗和电费
    let mobileEnergy = 0;
    let towerEnergy = 0;
    let mobileFee = 0;
    let towerFee = 0;

    energyData.forEach(item => {
        mobileEnergy += Number(item.mobile_cumulative_energy || 0) || 0;
        towerEnergy += Number(item.tower_cumulative_energy || 0) || 0;
        mobileFee += Number(item.mobile_electricity_fee || 0) || 0;
        towerFee += Number(item.tower_electricity_fee || 0) || 0;
    });

    const energyDataArray = [
        { name: '移动', value: Math.floor(mobileEnergy), itemStyle: { color: '#5470c6' } },
        { name: '铁塔', value: Math.floor(towerEnergy), itemStyle: { color: '#ee6666' } }
    ];

    const feeDataArray = [
        { name: '移动', value: Math.floor(mobileFee), itemStyle: { color: '#99CC66' } },
        { name: '铁塔', value: Math.floor(towerFee), itemStyle: { color: '#CC9966' } }
    ];

    const totalEnergy = mobileEnergy + towerEnergy;
    const totalFee = mobileFee + towerFee;
    console.log('用电方分类数据 - 移动:', mobileEnergy.toFixed(2), 'kWh,', mobileFee.toFixed(2), '元');
    console.log('用电方分类数据 - 铁塔:', towerEnergy.toFixed(2), 'kWh,', towerFee.toFixed(2), '元');

    if (totalEnergy === 0) {
        console.warn('没有用电方数据用于饼图显示');
        charts.consumerTypeChart.setOption({
            title: {
                text: '暂无数据',
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#999',
                    fontSize: 14,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                }
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                data: [],
                label: { show: false }
            }]
        });
        return;
    }

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const value = params.value.toLocaleString('zh-CN');
                const unit = params.seriesName === '能耗' ? 'kWh' : '元';
                const percent = params.percent.toFixed(1);
                return `<div style="font-family: Microsoft YaHei, SimHei, sans-serif; font-size: 12px; color: #fff; background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${params.seriesName} - ${params.name}</div>
                    <div>数值：${value} ${unit}</div>
                    <div>占比：${percent}%</div>
                </div>`;
            },
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            extraCssText: 'box-shadow: none; border: none;'
        },
        legend: [
            {
                // 外环图例（能耗）
                orient: 'vertical',
                right: '1%',
                top: '1%',
                textStyle: {
                    fontSize: 13,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff'
                },
                formatter: function(name) {
                    const energyData = energyDataArray.find(d => d.name === name);
                    const energy = energyData ? energyData.value.toLocaleString('zh-CN') : '0';
                    const energyPercent = totalEnergy > 0 ? ((energyData.value / totalEnergy) * 100).toFixed(1) : '0.0';
                    return `{energyTitle|能耗}  ${name}: ${energy} kWh (${energyPercent}%)`;
                },
                itemWidth: 15,
                itemHeight: 15,
                itemGap: 12,
                icon: 'roundRect',
                data: [
                    { name: '移动', icon: 'roundRect', itemStyle: { color: '#5470c6' } },
                    { name: '铁塔', icon: 'roundRect', itemStyle: { color: '#ee6666' } }
                ]
            },
            {
                // 内环图例（电费）
                orient: 'vertical',
                right: '1%',
                top: '35%',
                textStyle: {
                    fontSize: 13,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    color: '#fff'
                },
                formatter: function(name) {
                    const feeData = feeDataArray.find(d => d.name === name);
                    const fee = feeData ? feeData.value.toLocaleString('zh-CN') : '0';
                    const feePercent = totalFee > 0 ? ((feeData.value / totalFee) * 100).toFixed(1) : '0.0';
                    return `{feeTitle|电费}  ${name}: ${fee}元 (${feePercent}%)`;
                },
                itemWidth: 15,
                itemHeight: 15,
                itemGap: 12,
                icon: 'roundRect',
                data: [
                    { name: '移动', icon: 'roundRect', itemStyle: { color: '#99CC66' } },
                    { name: '铁塔', icon: 'roundRect', itemStyle: { color: '#CC9966' } }
                ]
            }
        ],
        // 富文本样式定义
        textStyle: {
            rich: {
                energyTitle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#90cdf4',
                    padding: [0, 0, 4, 0],
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    overflow: 'none'
                },
                feeTitle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#f6ad55',
                    padding: [0, 0, 4, 0],
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    overflow: 'none'
                }
            }
        },
        series: [
            {
                name: '能耗',
                type: 'pie',
                radius: ['45%', '60%'],
                center: ['30%', '50%'],
                avoidLabelOverlap: true,
                minShowLabelAngle: 5,
                label: {
                    show: true,
                    formatter: function(params) {
                        const percent = params.percent != null ? params.percent.toFixed(1) : '0.0';
                        return `${params.name}\n${percent}%`;
                    },
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    fontWeight: 'bold',
                    position: 'outside',
                    color: '#fff',
                    textShadowBlur: 2,
                    textShadowColor: 'rgba(0,0,0,0.5)'
                },
                labelLine: {
                    show: true,
                    length: 6,
                    length2: 8,
                    lineStyle: {
                        color: 'rgba(255,255,255,0.6)',
                        width: 1
                    }
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold',
                        fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                data: energyDataArray
            },
            {
                name: '电费',
                type: 'pie',
                radius: ['0%', '35%'],
                center: ['30%', '50%'],
                avoidLabelOverlap: true,
                minShowLabelAngle: 0,
                label: {
                    show: true,
                    formatter: function(params) {
                        const value = params.value.toLocaleString('zh-CN');
                        return `${params.name}\n${value}元`;
                    },
                    fontSize: 11,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    fontWeight: 'bold',
                    position: 'inside',
                    color: '#fff',
                    textShadowBlur: 2,
                    textShadowColor: 'rgba(0,0,0,0.5)'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                data: feeDataArray
            }
        ]
    };

    // 清除旧配置，避免合并
    charts.consumerTypeChart.clear();
    charts.consumerTypeChart.setOption(option, {
        notMerge: true
    });
    console.log('用电方分类饼图配置已设置');
}

// 导出图表函数
window.initCharts = initCharts;
window.updateElectricityChart = updateElectricityChart;
window.updatePoiChart = updatePoiChart;
window.updateElectricityTypeChart = updateElectricityTypeChart;
window.updateEnergyTrendChart = updateEnergyTrendChart;
window.updateConsumerTypeChart = updateConsumerTypeChart;
window.getCurrentTrendTimeType = getCurrentTrendTimeType;