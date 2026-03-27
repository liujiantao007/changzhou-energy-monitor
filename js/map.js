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
                    // 蓝色渐变：低值为白色，高值为深蓝色
                    color: ['#ffffff', '#e6f3ff', '#b3d9ff', '#80bfff', '#4da6ff', '#1a8cff', '#0073e6', '#0059b3', '#004080', '#00264d']
                },
                textStyle: {
                    fontSize: 12
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
                    show: true,
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
                    areaColor: 'rgba(240, 245, 255, 0.6)',
                    // 边界线颜色 - 使用较深的蓝色增强层次感
                    borderColor: 'rgba(24, 144, 255, 1)',
                    // 边界线宽度 - 增加到 1.5 使网格边界更清晰
                    borderWidth: 1.5
                }
            }
        ]};
        
        mapChart.setOption(option, true); // true 表示不合并，完全替换
        
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
                if (currentSelectedDistrict === regionName) {
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
                } else {
                    // 根据区域级别触发不同的数据筛选
                    filterDataByRegion(regionName, regionLevel);
                    // 同步更新选择器
                    if (typeof updateSelectorFromMap === 'function') {
                        updateSelectorFromMap(regionName);
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
                            center: [119.72, 31.62],
                            zoom: 1.2,
                            itemStyle: {
                                areaColor: 'rgba(255, 255, 255, 0.5)',
                                borderColor: 'rgba(24, 144, 255, 0.5)',
                                borderWidth: 1
                            },
                            emphasis: {
                                itemStyle: {
                                    areaColor: 'rgba(255, 214, 102, 0.5)'
                                }
                            }
                        },
                        series: [{
                            center: [119.72, 31.62],
                            zoom: 1.2
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
        
        console.log('处理数据项 - 区域:', region, '网格:', grid, '区县:', district, '能耗:', energy);
        
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
    const mapData = Object.entries(regionEnergy).map(([name, value]) => ({ 
        name, 
        value: Math.floor(value),
        level: regionLevel[name] || 'unknown'
    }));
    
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

// 按区域级别过滤数据（支持区县和网格）
function filterDataByRegion(regionName, regionLevel) {
    console.log('按区域级别过滤数据:', regionName, '级别:', regionLevel);
    
    // 更新当前选中的区域
    currentSelectedDistrict = regionName;
    
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
        
        // 提取网格名称关键词（如"西湖网格" -> "西湖"）
        const gridKeyword = regionName.replace(/网格/g, '');
        console.log('筛选关键词:', gridKeyword);
        
        filteredData = dataSource.filter(item => {
            const grid = item['GRID'] || ''; // 归属网格
            // 模糊匹配：包含关键词即可
            return grid.includes(gridKeyword) || grid.includes(regionName);
        });
        
        console.log('网格筛选后数据量:', filteredData.length);
        
        // 更新图表和地图
        if (typeof reloadDataWithFilter === 'function') {
            reloadDataWithFilter(filteredData, regionName);
        }
        
        // 取消之前的选中状态，然后选中当前网格
        if (mapChart) {
            mapChart.dispatchAction({
                type: 'unSelect',
                seriesIndex: 0
            });
            mapChart.dispatchAction({
                type: 'select',
                seriesIndex: 0,
                name: regionName
            });
        }
        
        // 更新地图高亮
        updateMapHighlight(regionName);
        return; // 直接返回，不进行后续筛选
    } else if (regionLevel === 'district') {
        // 区县级别：根据归属单元列（J列）进行筛选
        console.log('区县级别筛选:', regionName);
        
        // 提取区域名称关键词（如"武进区" -> "武进"）
        const districtKeyword = regionName.replace(/区|市|县/g, '');
        console.log('筛选关键词:', districtKeyword);
        
        filteredData = dataSource.filter(item => {
            const unit = item['J'] || ''; // 归属单元
            // 模糊匹配：包含关键词即可
            return unit.includes(districtKeyword) || unit.includes(regionName);
        });
        
        console.log('区县筛选后数据量:', filteredData.length);
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

// 存储区县和网格的对应关系
let gridsByDistrictMap = {};

// 初始化区县和网格选择器
function initDistrictSelector(districts, gridsByDistrict) {
    console.log('初始化选择器 - 区县:', districts);
    console.log('区县-网格对应关系:', gridsByDistrict);
    
    gridsByDistrictMap = gridsByDistrict;
    
    const districtSelect = document.getElementById('district-select');
    const gridSelect = document.getElementById('grid-select');
    
    if (!districtSelect || !gridSelect) {
        console.warn('选择器元素不存在');
        return;
    }
    
    // 填充区县选择器
    districtSelect.innerHTML = '<option value="">选择区县</option>';
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
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
        } else {
            // 禁用网格选择器
            gridSelect.disabled = true;
            gridSelect.innerHTML = '<option value="">选择网格</option>';
            
            // 重置为显示全部数据
            resetDistrictFilter();
        }
    });
    
    // 网格选择变化事件
    gridSelect.addEventListener('change', function() {
        const selectedGrid = this.value;
        
        if (selectedGrid) {
            // 筛选该网格数据
            filterDataByRegion(selectedGrid, 'grid');
        } else {
            // 如果没有选择网格，回到区县数据
            const selectedDistrict = districtSelect.value;
            if (selectedDistrict) {
                filterDataByRegion(selectedDistrict, 'district');
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
