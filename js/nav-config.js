/**
 * 导航页面配置文件
 * 用于配置各导航链接的目标地址
 *
 * 修改说明：
 * - baseURL: 基础地址前缀，默认为 10.38.78.217:8526
 * - pages: 各页面配置
 *   - id: 页面锚点ID
 *   - name: 页面名称（用于显示）
 *   - url: 页面完整URL路径（会拼接到 baseURL 后面）
 *
 * 示例：如果 baseURL = 'http://10.38.78.217:8526'
 *       那么 报账管理 的完整 URL = 'http://10.38.78.217:8526/baozhang'
 */

const NAV_CONFIG = {
    baseURL: 'http://10.38.78.217:8526',
    pages: {
        '报账管理': {
            id: '报账管理',
            path: '/baozhang'
        },
        '电表管理': {
            id: '电表管理',
            path: '/dianbiao'
        },
        '能耗分析': {
            id: '能耗分析',
            path: '/nenghao'
        },
        '报表管理': {
            id: '报表管理',
            path: '/baobiao'
        }
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NAV_CONFIG;
}
