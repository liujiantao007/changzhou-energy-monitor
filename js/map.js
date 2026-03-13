// 地图模块

// 全局地图实例
let mapChart = null;
// 当前选中的区域
let currentSelectedDistrict = null;

// 初始化地图
function initMap() {
    // 初始化地图图表
    const mapContainer = document.getElementById('map-chart');
    mapChart = echarts.init(mapContainer);
    
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
        
        // 初始化地图选项
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.value) {
                        return params.name + '<br/>能耗：' + params.value.toLocaleString('zh-CN') + ' kWh';
                    }
                    return params.name + '<br/>能耗：暂无数据';
                },
                textStyle: {
                    fontSize: 14
                }
            },
            visualMap: {
                min: 0,
                max: 2000,
                left: 'left',
                top: 'bottom',
                text: ['高', '低'],
                calculable: true,
                inRange: {
                    color: ['#e0f2ff', '#91d5ff', '#69c0ff', '#40a9ff', '#1890ff', '#096dd9']
                },
                textStyle: {
                    fontSize: 12
                }
            },
            geo: {
                map: '常州',
                roam: true,
                zoom: 1.0,
                center: [119.72, 31.58],
                aspectScale: 0.75,
                boundingCoords: null,
                label: {
                    show: true,
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        areaColor: '#ffd666'
                    }
                },
                itemStyle: {
                    areaColor: '#f0f5ff',
                    borderColor: '#1890ff',
                    borderWidth: 1
                }
            },
            series: [{
                name: '能耗',
                type: 'map',
                map: '常州',
                geoIndex: 0,
                roam: true,
                zoom: 1.0,
                center: [119.72, 31.58],
                aspectScale: 0.75,
                selectedMode: 'single',
                select: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        areaColor: '#ffd666'
                    }
                },
                label: {
                    show: true,
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei, SimHei, sans-serif'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        areaColor: '#ffd666'
                    }
                },
                itemStyle: {
                    areaColor: '#f0f5ff',
                    borderColor: '#1890ff',
                    borderWidth: 1
                },
                data: []
            }
        ]};
        
        mapChart.setOption(option);
        
        // 在地图渲染后，使用 setOption 精确设置中心位置
        setTimeout(() => {
            if (mapChart) {
                mapChart.setOption({
                    geo: {
                        center: [119.72, 31.58],
                        zoom: 1.0
                    },
                    series: [{
                        center: [119.72, 31.58],
                        zoom: 1.0
                    }]
                });
            }
        }, 200);
        
        // 绑定地图点击事件
        mapChart.on('click', function(params) {
            console.log('地图点击事件:', params);
            
            if (params.componentType === 'series' && params.seriesType === 'map') {
                // 点击了地图区域
                const district = params.name;
                console.log('点击了区域:', district);
                
                // 如果点击的是当前已选中的区域，则取消选中
                if (currentSelectedDistrict === district) {
                    console.log('取消选中区域');
                    resetDistrictFilter();
                } else {
                    // 触发数据筛选
                    filterDataByDistrict(district);
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
            }
        });
    }).catch(error => {
        // 隐藏加载状态
        mapChart.hideLoading();
        
        console.error('地图数据加载失败:', error);
        
        // 显示错误提示
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
                    color: '#666',
                    fontSize: 12
                }
            }
        });
    });
    
    // 窗口大小变化时重新调整地图大小
    window.addEventListener('resize', function() {
        if (mapChart) {
            mapChart.resize();
            
            // 重新调整地图视图以适应新的尺寸
            setTimeout(() => {
                if (mapChart) {
                    mapChart.setOption({
                        geo: {
                            center: [119.72, 31.58],
                            zoom: 1.0
                        },
                        series: [{
                            center: [119.72, 31.58],
                            zoom: 1.0
                        }]
                    });
                }
            }, 200);
        }
    });
}

// 加载地图数据
function loadMapData() {
    return new Promise((resolve, reject) => {
        const mapFilePath = 'data/常州市含经开区修复.json';
        console.log('地图JSON文件路径:', mapFilePath);
        console.log('开始加载常州市地图数据...');
        
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
                console.log('常州市地图数据加载成功');
                console.log('数据类型:', geoJson.type);
                console.log('要素数量:', geoJson.features ? geoJson.features.length : 0);
                
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
    
    const energyData = data.energyData || [];
    
    // 按区域统计能耗
    const districtEnergy = {};
    energyData.forEach(item => {
        const district = item['L'] || item['l'] || '';
        const energy = Number(item['AB'] || item['ab'] || 0) || 0;
        if (district) {
            if (districtEnergy[district]) {
                districtEnergy[district] += energy;
            } else {
                districtEnergy[district] = energy;
            }
        }
    });
    
    // 保存当前选中的区域
    const currentDistrict = getCurrentDistrict();
    
    const mapData = Object.entries(districtEnergy).map(([name, value]) => ({ 
        name, 
        value: Math.floor(value)
    }));
    
    console.log('地图数据:', mapData);
    console.log('当前选中区域:', currentDistrict);
    
    // 更新地图数据
    mapChart.setOption({
        series: [{
            data: mapData
        }]
    });
    
    // 在下一帧恢复选中状态
    if (currentDistrict) {
        requestAnimationFrame(() => {
            mapChart.dispatchAction({
                type: 'select',
                seriesIndex: 0,
                name: currentDistrict
            });
        });
    }
}

// 按区域过滤数据
function filterDataByDistrict(district) {
    console.log('按区域过滤数据:', district);
    
    // 更新当前选中的区域
    currentSelectedDistrict = district;
    
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

// 更新地图高亮
function updateMapHighlight(district) {
    if (!mapChart || !district) return;
    
    console.log('高亮地图区域:', district);
    
    // 使用 toggleSelect 实现持久化选中状态
    mapChart.dispatchAction({
        type: 'toggleSelect',
        seriesIndex: 0,
        name: district
    });
}

// 重置数据筛选（显示全部数据）
function resetDistrictFilter() {
    console.log('重置区域筛选，显示全部数据');
    
    const previousDistrict = currentSelectedDistrict;
    currentSelectedDistrict = null;
    
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
    
    // 取消地图选中状态
    if (mapChart && previousDistrict) {
        mapChart.dispatchAction({
            type: 'unSelect',
            seriesIndex: 0,
            name: previousDistrict
        });
    }
}

// 获取当前选中的区域
function getCurrentDistrict() {
    return currentSelectedDistrict;
}

// 导出地图函数
window.initMap = initMap;
window.updateMap = updateMap;
window.filterDataByDistrict = filterDataByDistrict;
window.resetDistrictFilter = resetDistrictFilter;
window.getCurrentDistrict = getCurrentDistrict;
