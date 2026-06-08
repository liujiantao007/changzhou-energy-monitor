// 地图模块

// 全局地图实例
let mapChart = null;
// 当前选中的区域
window.currentSelectedDistrict = null;

// 检测浏览器类型
function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Edg') !== -1) {
        return { name: 'Edge', version: parseFloat(ua.match(/Edg\/(\d+)/)[1]) || null };
    }
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) {
        return { name: 'Chrome', version: parseFloat(ua.match(/Chrome\/(\d+)/)[1]) || null };
    }
    if (ua.indexOf('Firefox') !== -1) {
        return { name: 'Firefox', version: parseFloat(ua.match(/Firefox\/(\d+)/)[1]) || null };
    }
    return { name: 'Unknown', version: null };
}

// 初始化地图
function initMap() {
    console.log('====================================');
    console.log('开始初始化地图...');
    
    const browser = getBrowserInfo();
    console.log('浏览器信息:', browser);
    
    if (typeof echarts === 'undefined') {
        console.error('ECharts 库未加载！');
        return;
    }
    console.log('ECharts 库已加载，版本:', echarts.version || '未知');
    
    const mapContainer = document.getElementById('map-chart');
    
    if (!mapContainer) {
        console.error('地图容器不存在 (id: map-chart)');
        console.log('当前页面所有元素:', document.getElementsByTagName('div').length, '个div');
        return;
    }
    
    console.log('地图容器:', mapContainer);
    
    const rect = mapContainer.getBoundingClientRect();
    console.log('地图容器实际显示尺寸:', rect.width.toFixed(2), 'x', rect.height.toFixed(2));
    console.log('地图容器offset尺寸:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
    console.log('地图容器style:', mapContainer.style.cssText);
    
    const computedStyle = window.getComputedStyle(mapContainer);
    console.log('地图容器computed width:', computedStyle.width);
    console.log('地图容器computed height:', computedStyle.height);
    
    if (rect.width < 10 || rect.height < 10) {
        console.warn('地图容器尺寸过小，尝试延迟初始化...');
        setTimeout(initMap, 500);
        return;
    }
    
    const chartWidth = rect.width;
    const chartHeight = rect.height;
    console.log('将使用的图表尺寸:', chartWidth.toFixed(2), 'x', chartHeight.toFixed(2));
    
    try {
        mapChart = window.mapChart = echarts.init(mapContainer, null, {
            renderer: 'canvas',
            width: chartWidth,
            height: chartHeight
        });
        console.log('ECharts 初始化成功');
        console.log('ECharts实例:', mapChart);
        
        const dom = mapChart.getDom();
        console.log('ECharts DOM元素:', dom);
        console.log('ECharts DOM尺寸:', dom.offsetWidth, 'x', dom.offsetHeight);
    } catch (error) {
        console.error('ECharts 初始化失败:', error.message);
        console.error('错误详情:', error);
        return;
    }
    console.log('====================================');
    
    // 显示加载状态
    mapChart.showLoading({
        text: '地图数据加载中...',
        color: '#1890ff',
        textColor: '#333',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        zlevel: 0,
        fontSize: 14,
        showSpinner: true,
        spinnerRadius: 10,
        lineWidth: 2
    });
    
    // 加载常州地理数据
    loadMapData().then(geoJson => {
        // 隐藏加载状态
        mapChart.hideLoading();
        
        // 注册地图
        echarts.registerMap('常州', geoJson);

        // 常州区县中心坐标（用于呼吸灯散点）
        window.__districtCoords = {
            '溧阳市': [119.48, 31.42],
            '金坛区': [119.56, 31.72],
            '武进区': [119.94, 31.70],
            '新北区': [119.97, 31.82],
            '天宁区': [120.00, 31.78],
            '钟楼区': [119.95, 31.78],
            '经开区': [120.05, 31.73]
        };

        // 初始化地图选项
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const level = params.data && params.data.level ? params.data.level : '';
                    const levelText = level === 'grid' ? '（网格）' : level === 'district' ? '（区县）' : '';
                    if (params.value) {
                        return params.name + levelText + '<br/>能耗：' + params.value.toLocaleString('zh-CN') + ' kWh';
                    }
                    return params.name + levelText + '<br/>能耗：暂无数据';
                },
                textStyle: {
                    fontSize: 14
                }
            },
            visualMap: {
                min: 0,
                max: 2000,
                left: 'left',
                bottom: 'bottom',
                orient: 'vertical',
                text: ['高', '低'],
                calculable: true,
                itemWidth: 20,
                itemHeight: 200,
                inRange: {
                    // 暗黑科技风青色渐变
                    color: ['#0a1628', '#0a2848', '#0a3d6b', '#005a9e', '#0077c2', '#0091ea', '#00b0ff', '#00d4ff', '#18ffff', '#84ffff']
                },
                textStyle: {
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.6)'
                }
            },
            series: [{
                name: '能耗',
                type: 'map',
                map: '常州',
                roam: true,
                zoom: 1.2,
                center: [119.72, 31.62],
                aspectScale: 0.75,
                selectedMode: 'single',
                data: [],
                select: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        formatter: function(params) {
                            // 选中时始终显示名称
                            return params.name;
                        }
                    },
                    itemStyle: {
                        areaColor: 'rgba(255, 214, 102, 0.8)'
                    }
                },
                label: {
                    show: false,
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                    formatter: function(params) {
                        // 只有当日总体能耗大于 0 才显示网格名称
                        if (params.value && params.value > 0) {
                            return params.name;
                        }
                        return '';
                    }
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold',
                        formatter: function(params) {
                            // 悬停时始终显示名称
                            return params.name;
                        }
                    },
                    itemStyle: {
                        areaColor: 'rgba(255, 214, 102, 0.8)'
                    }
                },
                itemStyle: {
                    // 基础区域颜色（无数据时的颜色）
                    areaColor: 'rgba(6, 25, 55, 0.5)',
                    // 边界线颜色 - 亮青色科技感
                    borderColor: 'rgba(0, 180, 255, 0.6)',
                    // 边界线宽度
                    borderWidth: 1.5,
                    // 添加阴影效果
                    shadowBlur: 5,
                    shadowColor: 'rgba(0, 180, 255, 0.1)',
                    shadowOffsetX: 0,
                    shadowOffsetY: 2
                }
            },
        // 第二个系列：呼吸灯散点效果
        {
            name: '能耗节点',
            id: 'effectScatter',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: [],
            symbolSize: function(val) {
                return Math.max(5, Math.min(20, (val[2] || 0) / 5000));
            },
            showEffectOn: 'render',
            rippleEffect: {
                brushType: 'stroke',
                scale: 3,
                period: 4
            },
            hoverAnimation: true,
            label: {
                formatter: function(params) {
                    return params.name;
                },
                position: 'right',
                show: true,
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)'
            },
            itemStyle: {
                color: '#00d4ff',
                shadowBlur: 10,
                shadowColor: '#00d4ff'
            },
            zlevel: 2
        }
    ]};
        
        // 添加错误处理
        try {
            mapChart.setOption(option, true); // true 表示不合并，完全替换
            // 保存原始 visualMap 配置，用于取消高亮时恢复
            window.__savedVisualMap = JSON.parse(JSON.stringify(option.visualMap));

            // 初始化呼吸灯散点数据（先使用默认值，后续在 updateMap 中更新）
            var initScatterData = [];
            for (var districtName in window.__districtCoords) {
                var coord = window.__districtCoords[districtName];
                initScatterData.push({
                    name: districtName,
                    value: coord.concat(0)
                });
            }
            mapChart.setOption({
                series: [{
                    id: 'effectScatter',
                    data: initScatterData
                }]
            });
        } catch (error) {
            console.warn('初始化地图选项时出错:', error.message);
        }
        
        // 绑定地图点击事件
        mapChart.on('click', function(params) {
            console.log('地图点击事件:', params);
            
            if (params.componentType === 'series' && params.seriesType === 'map') {
                // 点击了地图区域
                const regionName = params.name;
                const regionData = params.data || {};
                const regionLevel = regionData.level || 'unknown';
                
                console.log('点击了区域:', regionName, '级别:', regionLevel);
                
                // 如果点击的是当前已选中的区域，则取消选中
                if (window.currentSelectedDistrict === regionName) {
                    console.log('取消选中区域');
                    resetDistrictFilter();
                    // 重置选择器
                    const districtSelect = document.getElementById('district-select');
                    const gridSelect = document.getElementById('grid-select');
                    if (districtSelect) districtSelect.value = '';
                    if (gridSelect) {
                        gridSelect.value = '';
                        gridSelect.disabled = true;
                    }
                    // 恢复显示全部事件
                    if (typeof window.filterEventsByRegion === 'function') {
                        window.filterEventsByRegion('', '');
                    }
                    // 恢复显示全部告警
                    if (typeof window.filterAlarmsByRegion === 'function') {
                        window.filterAlarmsByRegion('');
                    }
                } else {
                    // 根据区域级别触发不同的数据筛选
                    filterDataByRegion(regionName, regionLevel);
                    // 同步更新选择器
                    if (typeof updateSelectorFromMap === 'function') {
                        updateSelectorFromMap(regionName);
                    }
                    // 同步筛选事件总览
                    if (typeof window.filterEventsByRegion === 'function') {
                        const districtSel = document.getElementById('district-select');
                        const gridSel = document.getElementById('grid-select');
                        window.filterEventsByRegion(
                            districtSel ? districtSel.value : '',
                            gridSel ? gridSel.value : ''
                        );
                    }
                    // 同步筛选告警总览
                    if (typeof window.filterAlarmsByRegion === 'function') {
                        const districtSel = document.getElementById('district-select');
                        window.filterAlarmsByRegion(districtSel ? districtSel.value : '');
                    }
                }
            } else {
                // 点击了地图外的区域，重置筛选
                console.log('点击了地图外区域，重置筛选');
                resetDistrictFilter();
            }
        });
        
        // 绑定地图空白区域点击事件
        mapChart.getZr().on('click', function(params) {
            // 如果点击的不是地图区域，重置筛选
            if (!params.target) {
                console.log('点击了空白区域，重置筛选');
                resetDistrictFilter();
                // 重置选择器
                const districtSelect = document.getElementById('district-select');
                const gridSelect = document.getElementById('grid-select');
                if (districtSelect) districtSelect.value = '';
                if (gridSelect) {
                    gridSelect.value = '';
                    gridSelect.disabled = true;
                }
                // 恢复显示全部事件
                if (typeof window.filterEventsByRegion === 'function') {
                    window.filterEventsByRegion('', '');
                }
                // 恢复显示全部告警
                if (typeof window.filterAlarmsByRegion === 'function') {
                    window.filterAlarmsByRegion('');
                }
            }
        });
    }).catch(error => {
        // 隐藏加载状态
        mapChart.hideLoading();
        
        console.error('地图数据加载失败:', error);
        
        // 显示错误提示
        try {
            mapChart.setOption({
                title: {
                    text: '地图数据加载失败',
                    subtext: '请检查网络连接或刷新页面重试',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        color: '#ff4d4f',
                        fontSize: 16,
                        fontWeight: 'bold'
                    },
                    subtextStyle: {
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 12
                    }
                }
            });
        } catch (err) {
            console.warn('显示错误提示时出错:', err.message);
        }
    });
    
    // 窗口大小变化时重新调整地图大小
    window.addEventListener('resize', function() {
        if (mapChart) {
            mapChart.resize();
            
            // 重新调整地图视图以适应新的尺寸
            setTimeout(() => {
                if (mapChart) {
                    try {
                        // 只更新 series 配置，不使用 geo 配置
                        mapChart.setOption({
                            series: [{
                                center: [119.72, 31.62],
                                zoom: 1.2
                            }]
                        });
                    } catch (error) {
                        console.warn('调整地图视图时出错:', error.message);
                    }
                }
            }, 200);
        }
    });
}

// 加载地图数据
function loadMapData() {
    return new Promise((resolve, reject) => {
        const mapFilePath = 'data/常州区县网格地图.json';
        console.log('地图JSON文件路径:', mapFilePath);
        console.log('开始加载常州市网格地图数据...');
        
        // 使用 fetch 加载本地 JSON 文件
        fetch(mapFilePath)
            .then(response => {
                console.log('响应状态:', response.status);
                if (!response.ok) {
                    throw new Error('网络响应异常：' + response.status);
                }
                return response.json();
            })
            .then(geoJson => {
                console.log('常州市网格地图数据加载成功');
                console.log('数据类型:', geoJson.type);
                console.log('要素数量:', geoJson.features ? geoJson.features.length : 0);
                
                // 提取区县和网格数据
                const districts = new Set();
                const gridsByDistrict = {};
                
                geoJson.features.forEach(feature => {
                    const name = feature.properties.name;
                    const level = feature.properties.level;
                    const parent = feature.properties.parent || '';
                    
                    if (level === 'district') {
                        districts.add(name);
                        gridsByDistrict[name] = [];
                    } else if (level === 'grid') {
                        // 找到网格所属的区县
                        // 需要去掉区县名称中的"区"字来匹配 parent
                        for (const district of districts) {
                            const districtShort = district.replace(/区|市|县/g, '');
                            if (parent.includes(districtShort) || parent === districtShort || 
                                name.includes(districtShort) || name.includes(district.replace(/区|市|县/g, ''))) {
                                if (!gridsByDistrict[district]) {
                                    gridsByDistrict[district] = [];
                                }
                                gridsByDistrict[district].push(name);
                                break;
                            }
                        }
                    }
                });
                
                // 初始化选择器
                initDistrictSelector(Array.from(districts), gridsByDistrict);
                
                // 统计区县和网格数量
                let districtCount = 0;
                let gridCount = 0;
                geoJson.features.forEach(feature => {
                    if (feature.properties.level === 'district') {
                        districtCount++;
                    } else if (feature.properties.level === 'grid') {
                        gridCount++;
                    }
                });
                console.log('区县数量:', districtCount, '网格数量:', gridCount);
                
                // 验证数据格式
                if (!geoJson.type || geoJson.type !== 'FeatureCollection') {
                    throw new Error('无效的 GeoJSON 格式');
                }
                
                if (!geoJson.features || !Array.isArray(geoJson.features)) {
                    throw new Error('缺少 features 数组');
                }
                
                // 验证每个要素
                geoJson.features.forEach((feature, index) => {
                    if (!feature.properties || !feature.properties.name) {
                        console.warn('要素 ' + index + ' 缺少名称属性');
                    }
                    if (!feature.geometry) {
                        console.warn('要素 ' + index + ' 缺少几何信息');
                    }
                });
                
                console.log('数据验证通过，共有 ' + geoJson.features.length + ' 个区域要素');
                resolve(geoJson);
            })
            .catch(error => {
                console.error('加载常州市含经开区.json失败:', error);
                
                // 如果加载失败，使用备用模拟数据
                console.log('使用备用模拟数据');
                const mockGeoJson = {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: { name: '天宁区' },
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [[[[119.96, 31.78], [120.06, 31.78], [120.06, 31.83], [119.96, 31.83], [119.96, 31.78]]]]
                            }
                        },
                        {
                            type: 'Feature',
                            properties: { name: '钟楼区' },
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [[[[119.88, 31.78], [119.96, 31.78], [119.96, 31.83], [119.88, 31.83], [119.88, 31.78]]]]
                            }
                        },
                        {
                            type: 'Feature',
                            properties: { name: '新北区' },
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [[[[119.96, 31.83], [120.06, 31.83], [120.06, 31.90], [119.96, 31.90], [119.96, 31.83]]]]
                            }
                        },
                        {
                            type: 'Feature',
                            properties: { name: '武进区' },
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [[[[119.96, 31.70], [120.06, 31.70], [120.06, 31.78], [119.96, 31.78], [119.96, 31.70]]]]
                            }
                        },
                        {
                            type: 'Feature',
                            properties: { name: '经开区' },
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [[[[120.06, 31.70], [120.16, 31.70], [120.16, 31.78], [120.06, 31.78], [120.06, 31.70]]]]
                            }
                        }
                    ]
                };
                resolve(mockGeoJson);
            });
    });
}

// 更新地图数据
function updateMap(data) {
    if (!mapChart) return;

    // 添加全局错误处理
    try {
        const energyData = data.energyData || [];

        console.log('=== updateMap 被调用 ===');
        console.log('energyData 数据量:', energyData.length);
        if (energyData.length > 0) {
            console.log('前 3 条数据:', energyData.slice(0, 3));
        }

    // 按区域统计能耗（支持区县和网格）
    const regionEnergy = {};
    const regionLevel = {}; // 记录区域级别

    energyData.forEach(item => {
        // 优先使用归属网格，如果没有则使用归属单元
        const grid = item['GRID'] || '';
        const district = item['J'] || '';
        const region = grid || district;
        const energy = Number(item['AB'] || item['ab'] || 0) || 0;

        if (region) {
            if (regionEnergy[region]) {
                regionEnergy[region] += energy;
            } else {
                regionEnergy[region] = energy;
            }
            // 记录级别：如果有网格数据则为 grid，否则为 district
            regionLevel[region] = grid ? 'grid' : 'district';
        }
    });

    console.log('区域统计结果:', regionEnergy);
    console.log('区域级别:', regionLevel);

    // 保存当前选中的区域
    const currentDistrict = getCurrentDistrict();

    // 构建地图数据（包含 level 属性）
    let mapData = Object.entries(regionEnergy).map(([name, value]) => ({
        name,
        value: Math.floor(value),
        level: regionLevel[name] || 'unknown'
    }));

    // 特殊处理：当选中区县时，确保显示区县轮廓而不是单个网格
    if (currentDistrict) {
        // 如果当前选中的是区县，则需要确保地图显示区县轮廓
        const isDistrictSelected = !currentDistrict.includes('网格');
        if (isDistrictSelected) {
            console.log('选中区县:', currentDistrict, '确保显示区县轮廓');

            // 检查是否已有该区县的数据
            const hasDistrictData = mapData.some(item =>
                item.name === currentDistrict ||
                item.name === currentDistrict.replace(/区|市|县/g, '')
            );

            if (!hasDistrictData) {
                console.log('地图数据中无该区县数据，添加区县轮廓数据');
                // 查找该区县的所有网格数据
                const districtGridData = mapData.filter(item =>
                    item.level === 'grid' &&
                    item.name.includes(currentDistrict.replace(/区|市|县/g, ''))
                );

                if (districtGridData.length > 0) {
                    // 计算该区县的总能耗
                    const districtTotalEnergy = districtGridData.reduce((sum, item) => sum + item.value, 0);

                    // 添加区县轮廓数据，使用完整的区县名称（如"武进区"）
                    mapData.push({
                        name: currentDistrict, // 使用完整名称
                        value: districtTotalEnergy,
                        level: 'district'
                    });

                    console.log('已添加区县轮廓数据:', currentDistrict);
                    console.log('区县总能耗:', districtTotalEnergy);

                    // 移除该区县的所有网格数据，只显示区县轮廓
                    mapData = mapData.filter(item =>
                        !(item.level === 'grid' &&
                          item.name.includes(currentDistrict.replace(/区|市|县/g, '')))
                    );

                    console.log('已移除该区县的网格数据');
                }
            }
        }
    }
    
    console.log('最终地图数据:', mapData);
    console.log('当前选中区域:', currentDistrict);
    
    // 调试：打印地图数据详情
    if (mapData.length > 0) {
        console.log('地图数据详情:', JSON.stringify(mapData, null, 2));
    } else {
        console.warn('地图数据为空！请检查数据源');
    }
    
    // 动态计算 visualMap 的数值范围
    const values = mapData.map(item => item.value).filter(v => v > 0);
    let min = 0;
    let max = 2000; // 默认最大值
    
    if (values.length > 0) {
        const dataMax = Math.max(...values);
        const dataMin = Math.min(...values);
        
        // 根据数据范围动态设置 max 值，确保颜色分布合理
        // 使用数据最大值的 1.2 倍作为 max，避免颜色过度集中
        max = Math.ceil(dataMax * 1.2);
        // 确保 max 至少为 100，避免过小的数值范围
        max = Math.max(max, 100);
        
        // 如果数据范围很小，使用固定范围
        if (dataMax - dataMin < 100) {
            max = Math.ceil(dataMax / 100) * 100 + 100;
        }
    }
    
    console.log('visualMap 范围设置:', min, '-', max);
    
    // 更新地图数据和 visualMap
    mapChart.setOption({
        visualMap: {
            min: min,
            max: max
        },
        series: [{
            data: mapData
        }]
    });

    // 更新呼吸灯散点数据（根据各区县总能耗）
    var coords = window.__districtCoords || {};
    var scatterData = [];
    var distEnergy = {}; // 按区县汇总能耗

    // 从 mapData 中按区县汇总
    var districtKeys = Object.keys(coords);
    mapData.forEach(function(d) {
        if (d.level === 'grid') {
            // 查找归属区县
            for (var k = 0; k < districtKeys.length; k++) {
                var dk = districtKeys[k].replace(/区|市|县/g, '');
                if (d.name.indexOf(dk) !== -1) {
                    if (!distEnergy[districtKeys[k]]) distEnergy[districtKeys[k]] = 0;
                    distEnergy[districtKeys[k]] += d.value;
                    break;
                }
            }
        } else if (d.level === 'district') {
            for (var k2 = 0; k2 < districtKeys.length; k2++) {
                if (d.name.indexOf(districtKeys[k2]) !== -1 || districtKeys[k2].indexOf(d.name) !== -1) {
                    distEnergy[districtKeys[k2]] = d.value;
                    break;
                }
            }
        }
    });

    for (var dn in distEnergy) {
        if (coords[dn] && distEnergy[dn] > 0) {
            scatterData.push({
                name: dn,
                value: coords[dn].concat(distEnergy[dn])
            });
        }
    }

    if (scatterData.length > 0) {
        mapChart.setOption({
            series: [{
                id: 'effectScatter',
                data: scatterData
            }]
        });
    }
    
    // 在下一帧恢复选中状态
    if (currentDistrict) {
        requestAnimationFrame(() => {
            updateMapHighlight(currentDistrict);
        });
    }
    
    // 如果是首次加载数据，自动触发一次重置筛选以显示所有能耗>0 的网格
    if (!window.mapDataLoaded) {
        window.mapDataLoaded = true;
        console.log('首次加载地图数据，自动重置筛选');
        setTimeout(() => {
            if (typeof resetDistrictFilter === 'function') {
                resetDistrictFilter();
            }
        }, 500);
    }
    } catch (error) {
        console.warn('更新地图时出错，跳过:', error.message);
    }
}

// 按区域过滤数据
function filterDataByDistrict(district) {
    console.log('按区域过滤数据:', district);
    
    // 更新当前选中的区域
    window.currentSelectedDistrict = district;
    
    // 从原始完整数据中筛选（而不是从已筛选的数据中筛选）
    const dataSource = window.originalDataCache || window.rawDataCache || [];
    
    if (!dataSource || dataSource.length === 0) {
        console.warn('数据缓存不存在');
        return;
    }
    
    console.log('数据源数据量:', dataSource.length);
    
    // 筛选数据：根据归属单元列（J列）进行筛选
    let filteredData;
    if (district) {
        // 提取区域名称关键词（如"武进区" -> "武进"）
        const districtKeyword = district.replace(/区|市|县/g, '');
        console.log('筛选关键词:', districtKeyword);
        
        filteredData = dataSource.filter(item => {
            const unit = item['J'] || ''; // 归属单元
            // 模糊匹配：包含关键词即可
            return unit.includes(districtKeyword) || unit.includes(district);
        });
        
        console.log('筛选后数据量:', filteredData.length, '原始数据量:', dataSource.length);
    } else {
        // 如果没有指定区域，使用全部数据
        filteredData = dataSource;
    }
    
    // 调用数据更新函数
    if (typeof reloadDataWithFilter === 'function') {
        reloadDataWithFilter(filteredData, district);
    } else if (typeof reloadDataWithoutLoading === 'function') {
        reloadDataWithoutLoading();
    }
    
    // 更新地图高亮
    updateMapHighlight(district);
}

// 按区域级别过滤数据（支持区县和网格）
function filterDataByRegion(regionName, regionLevel) {
    console.log('按区域级别过滤数据:', regionName, '级别:', regionLevel);
    
    // 更新当前选中的区域
    window.currentSelectedDistrict = regionName;
    
    // 从原始完整数据中筛选
    const dataSource = window.originalDataCache || window.rawDataCache || [];
    
    if (!dataSource || dataSource.length === 0) {
        console.warn('数据缓存不存在');
        return;
    }
    
    console.log('数据源数据量:', dataSource.length);
    
    let filteredData;
    
    if (regionLevel === 'grid') {
        // 网格级别：根据 GRID 列进行筛选
        console.log('网格级别筛选:', regionName);
        console.log('数据源数据量:', dataSource.length);
        
        // 提取网格名称关键词（如"西湖网格" -> "西湖"）
        const gridKeyword = regionName.replace(/网格/g, '');
        console.log('筛选关键词:', gridKeyword);
        
        // 打印前5条数据的网格信息
        console.log('前5条数据网格信息:', dataSource.slice(0, 5).map(item => ({ grid: item['GRID'], unit: item['J'] })));
        
        filteredData = dataSource.filter(item => {
            const grid = item['GRID'] || ''; // 归属网格
            // 模糊匹配：包含关键词即可
            const match = grid.includes(gridKeyword) || grid.includes(regionName);
            return match;
        });
        
        console.log('网格筛选后数据量:', filteredData.length);
        if (filteredData.length === 0) {
            console.warn('网格筛选后数据为空，可能的原因：');
            console.warn('1. 数据源中没有该网格的数据');
            console.warn('2. 网格名称格式不匹配');
            console.warn('3. GRID 列数据为空');
        }
        
        // 更新图表和地图
        if (typeof reloadDataWithFilter === 'function') {
            reloadDataWithFilter(filteredData, regionName);
        }
        
        // 更新地图高亮（数据驱动方式，dispatchAction 在此版本无效）
        updateMapHighlight(regionName);
        return; // 直接返回，不进行后续筛选
    } else if (regionLevel === 'district') {
        // 区县级别：根据归属单元列（J列）进行筛选
        console.log('区县级别筛选:', regionName);
        
        // 提取区域名称关键词（如"武进区" -> "武进"）
        const districtKeyword = regionName.replace(/区|市|县/g, '');
        console.log('筛选关键词:', districtKeyword);
        console.log('数据源数据量:', dataSource.length);
        
        // 打印前5条数据的归属单元信息
        console.log('前5条数据归属单元信息:', dataSource.slice(0, 5).map(item => ({ unit: item['J'], grid: item['GRID'] })));
        
        filteredData = dataSource.filter(item => {
            const unit = item['J'] || ''; // 归属单元
            // 模糊匹配：包含关键词即可
            return unit.includes(districtKeyword) || unit.includes(regionName);
        });
        
        console.log('区县筛选后数据量:', filteredData.length);
        if (filteredData.length === 0) {
            console.warn('区县筛选后数据为空，可能的原因：');
            console.warn('1. 数据源中没有该区县的数据');
            console.warn('2. 归属单元名称格式不匹配');
            console.warn('3. 归属单元列为空');
        }
    } else {
        // 未知级别，尝试两种匹配方式
        console.log('未知级别，尝试匹配:', regionName);
        
        const districtKeyword = regionName.replace(/区|市|县|网格/g, '');
        
        filteredData = dataSource.filter(item => {
            const unit = item['J'] || '';
            const grid = item['GRID'] || '';
            return unit.includes(districtKeyword) || grid.includes(districtKeyword) || 
                   unit.includes(regionName) || grid.includes(regionName);
        });
        
        console.log('筛选后数据量:', filteredData.length);
    }
    
    // 调用数据更新函数
    if (typeof reloadDataWithFilter === 'function') {
        reloadDataWithFilter(filteredData, regionName);
    } else if (typeof reloadDataWithoutLoading === 'function') {
        reloadDataWithoutLoading();
    }

    // 更新地图高亮
    updateMapHighlight(regionName);
    
    // 更新地图高亮
    updateMapHighlight(regionName);
}

// 更新地图高亮
function updateMapHighlight(district) {
    if (!mapChart || !district) return;

    console.log('高亮地图区域:', district);

    // 获取当前 option 和 visualMap 范围
    var opt = mapChart.getOption();
    var vm = window.__savedVisualMap || (opt.visualMap && opt.visualMap[0]) || {};
    var minVal = vm.min || 0;
    var maxVal = vm.max || 100;
    var colors = vm.inRange && vm.inRange.color || ['#0a1628', '#00d4ff'];

    // 获取当前地图数据
    var seriesData = (opt.series && opt.series[0] && opt.series[0].data) || [];
    console.log('updateMapHighlight数据量:', seriesData.length, '查找名称:', district);

    if (seriesData.length === 0) {
        console.error('地图数据为空，无法高亮');
        return;
    }

    var districtKeyword = district.replace(/区|市|县/g, '');
    var isGridSelection = district.includes('网格');

    // 构建全新数据数组
    var newData = [];

    if (isGridSelection) {
        // 网格选择：不跳过任何条目，直接全部添加
        seriesData.forEach(function(d) {
            newData.push({ name: d.name, value: d.value, level: d.level });
        });
    } else {
        // 区县选择：跳过旧区县条目，添加金色区县轮廓

        // 汇总该区县内所有网格的能耗
        var gridData = seriesData.filter(function(d) {
            return d.level === 'grid' && d.name.includes(districtKeyword);
        });
        var districtTotal = 0;
        if (gridData.length > 0) {
            districtTotal = gridData.reduce(function(sum, d) { return sum + d.value; }, 0);
        } else {
            var existDistrict = seriesData.find(function(d) {
                return d.level === 'district' && d.name.includes(districtKeyword);
            });
            if (existDistrict) {
                districtTotal = existDistrict.value;
            }
        }

        seriesData.forEach(function(d) {
            if (d.level === 'district' && d.name.includes(districtKeyword)) {
                return;
            }
            newData.push({ name: d.name, value: d.value, level: d.level });
        });

        newData.push({
            name: district,
            value: districtTotal || 0,
            level: 'district',
            itemStyle: {
                areaColor: 'rgba(0, 180, 255, 0.3)',
                borderColor: '#00d4ff',
                borderWidth: 3,
                shadowBlur: 15,
                shadowColor: 'rgba(0, 212, 255, 0.4)'
            },
            label: {
                show: true,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#00d4ff',
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowBlur: 4,
                formatter: function() { return district; }
            },
            emphasis: {
                label: { show: true, fontSize: 18, fontWeight: 'bold', color: '#00d4ff' },
                itemStyle: { areaColor: 'rgba(0, 180, 255, 0.4)', borderColor: '#18ffff', borderWidth: 4 }
            }
        });
    }

    // 高亮目标（网格选择时高亮网格，区县选择时高亮区县轮廓）
    var targetFound = false;
    newData.forEach(function(d) {
        var isTarget = d.name === district;
        if (isTarget) {
            targetFound = true;
            d.itemStyle = {
                areaColor: 'rgba(0, 180, 255, 0.3)',
                borderColor: '#00d4ff',
                borderWidth: 3,
                shadowBlur: 15,
                shadowColor: 'rgba(0, 212, 255, 0.4)'
            };
            d.label = {
                show: true,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#00d4ff',
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowBlur: 4,
                formatter: function() { return district; }
            };
        }
    });

    if (!targetFound) {
        console.warn('未找到高亮目标:', district);
    }

    // 只更新系列数据，不修改 visualMap（保持原始蓝色渐变图例）
    mapChart.setOption({
        series: [{ data: newData }]
    });

    console.log('地图高亮完成:', district);
}

// 重置数据筛选（显示全部数据）
function resetDistrictFilter() {
    console.log('重置区域筛选，显示全部数据');

    const previousDistrict = window.currentSelectedDistrict;
    window.currentSelectedDistrict = null;

    // 恢复原始完整数据
    if (window.originalDataCache && window.originalDataCache.length > 0) {
        window.rawDataCache = window.originalDataCache;
        console.log('恢复原始数据，数据量:', window.rawDataCache.length);
    }

    // 清除缓存
    if (typeof clearDataCache === 'function') {
        clearDataCache();
    }

    // 重新加载数据
    if (typeof reloadDataWithoutLoading === 'function') {
        reloadDataWithoutLoading();
    }

    // 恢复显示全部事件
    if (typeof window.filterEventsByRegion === 'function') {
        window.filterEventsByRegion('', '');
    }

    // 取消所有地图高亮：移除自定义样式，由当前 visualMap 自动配色
    if (mapChart) {
        var opt = mapChart.getOption();
        mapChart.setOption({
            series: [{ data: opt.series[0].data.map(function(d) {
                return { name: d.name, value: d.value, level: d.level };
            })}]
        });
        console.log('已取消地图高亮');
    }
}

// 获取当前选中的区域
function getCurrentDistrict() {
    return window.currentSelectedDistrict;
}

// 存储区县和网格的对应关系
let gridsByDistrictMap = {};
let selectorsInitialized = false;

// 初始化区县和网格选择器
function initDistrictSelector(districts, gridsByDistrict) {
    if (selectorsInitialized) {
        console.log('选择器已初始化，跳过重复绑定');
        return;
    }
    selectorsInitialized = true;
    
    console.log('初始化选择器 - 区县:', districts);
    console.log('区县-网格对应关系:', gridsByDistrict);
    
    gridsByDistrictMap = gridsByDistrict;
    
    const districtSelect = document.getElementById('district-select');
    const gridSelect = document.getElementById('grid-select');
    
    if (!districtSelect || !gridSelect) {
        console.warn('选择器元素不存在');
        return;
    }
    
    // 区县排序（用户指定顺序）
    const districtOrder = ['武进区', '新北区', '天宁区', '钟楼区', '经开区', '溧阳市', '金坛区'];
    // 显示名称映射（value 保持 GeoJSON 原名，显示文字用用户习惯的名称）
    const displayNames = {
        '溧阳市': '溧阳市',
        '金坛区': '金坛区'
    };

    // 按指定顺序排序
    const sortedDistricts = [...districts].sort((a, b) => {
        const ai = districtOrder.indexOf(a);
        const bi = districtOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    console.log('排序后区县顺序:', sortedDistricts);

    // 填充区县选择器
    districtSelect.innerHTML = '<option value="">选择区县</option>';
    sortedDistricts.forEach(district => {
        const option = document.createElement('option');
        option.value = district; // value 保持 GeoJSON 原名
        option.textContent = displayNames[district] || district; // 显示名称用映射
        districtSelect.appendChild(option);
    });
    
    // 区县选择变化事件
    districtSelect.addEventListener('change', function() {
        const selectedDistrict = this.value;

        if (selectedDistrict) {
            // 启用网格选择器
            gridSelect.disabled = false;

            // 填充网格选择器
            const grids = gridsByDistrict[selectedDistrict] || [];
            gridSelect.innerHTML = '<option value="">选择网格</option>';

            grids.forEach(grid => {
                const option = document.createElement('option');
                option.value = grid;
                option.textContent = grid;
                gridSelect.appendChild(option);
            });

            // 筛选该区县数据
            filterDataByRegion(selectedDistrict, 'district');
            // 同步筛选事件总览
            if (typeof window.filterEventsByRegion === 'function') {
                window.filterEventsByRegion(selectedDistrict, '');
            }
            // 同步筛选告警总览
            if (typeof window.filterAlarmsByRegion === 'function') {
                window.filterAlarmsByRegion(selectedDistrict);
            }
        } else {
            // 禁用网格选择器
            gridSelect.disabled = true;
            gridSelect.innerHTML = '<option value="">选择网格</option>';

            // 重置为显示全部数据
            resetDistrictFilter();
            // 恢复显示全部事件
            if (typeof window.filterEventsByRegion === 'function') {
                window.filterEventsByRegion('', '');
            }
            // 恢复显示全部告警
            if (typeof window.filterAlarmsByRegion === 'function') {
                window.filterAlarmsByRegion('');
            }
        }
    });

    // 网格选择变化事件
    gridSelect.addEventListener('change', function() {
        const selectedGrid = this.value;

        if (selectedGrid) {
            // 筛选该网格数据
            filterDataByRegion(selectedGrid, 'grid');
            // 同步筛选事件总览
            if (typeof window.filterEventsByRegion === 'function') {
                window.filterEventsByRegion(districtSelect.value, selectedGrid);
            }
            // 同步筛选告警总览
            if (typeof window.filterAlarmsByRegion === 'function') {
                window.filterAlarmsByRegion(districtSelect.value);
            }
        } else {
            // 如果没有选择网格，回到区县数据
            const selectedDistrict = districtSelect.value;
            if (selectedDistrict) {
                filterDataByRegion(selectedDistrict, 'district');
                if (typeof window.filterEventsByRegion === 'function') {
                    window.filterEventsByRegion(selectedDistrict, '');
                }
                if (typeof window.filterAlarmsByRegion === 'function') {
                    window.filterAlarmsByRegion(selectedDistrict);
                }
            }
        }
    });
    
    console.log('选择器初始化完成');
}

// 更新选择器的选中状态（用于地图点击时同步）
function updateSelectorFromMap(regionName) {
    const districtSelect = document.getElementById('district-select');
    const gridSelect = document.getElementById('grid-select');
    
    if (!districtSelect || !gridSelect) return;
    
    console.log('更新选择器 - 区域:', regionName);
    console.log('当前网格-区县映射:', gridsByDistrictMap);
    
    // 判断是区县还是网格
    const isGrid = regionName.includes('网格');
    
    if (isGrid) {
        // 找到所属区县 - 需要去掉区县名称中的"区"字来匹配
        let foundDistrict = null;
        
        for (const district in gridsByDistrictMap) {
            const districtShort = district.replace(/区|市|县/g, '');
            const grids = gridsByDistrictMap[district] || [];
            
            console.log('检查区县:', district, '简称:', districtShort, '包含网格:', grids);
            
            if (grids.includes(regionName) || regionName.includes(districtShort)) {
                foundDistrict = district;
                break;
            }
        }
        
        console.log('找到的区县:', foundDistrict);
        
        if (foundDistrict) {
            districtSelect.value = foundDistrict;
            gridSelect.disabled = false;
            
            // 填充该区县的网格列表
            const grids = gridsByDistrictMap[foundDistrict] || [];
            gridSelect.innerHTML = '<option value="">选择网格</option>';
            grids.forEach(grid => {
                const option = document.createElement('option');
                option.value = grid;
                option.textContent = grid;
                gridSelect.appendChild(option);
            });
            
            // 设置选中的网格
            gridSelect.value = regionName;
        }
    } else {
        // 区县
        districtSelect.value = regionName;
        gridSelect.disabled = false;
        const grids = gridsByDistrictMap[regionName] || [];
        gridSelect.innerHTML = '<option value="">选择网格</option>';
        grids.forEach(grid => {
            const option = document.createElement('option');
            option.value = grid;
            option.textContent = grid;
            gridSelect.appendChild(option);
        });
        gridSelect.value = '';
    }
}

// 导出地图函数
window.initMap = initMap;
window.updateMap = updateMap;
window.filterDataByDistrict = filterDataByDistrict;
window.resetDistrictFilter = resetDistrictFilter;
window.getCurrentDistrict = getCurrentDistrict;
window.updateSelectorFromMap = updateSelectorFromMap;
window.updateMapHighlight = updateMapHighlight;
