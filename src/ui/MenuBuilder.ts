/**
 * 菜单构建器
 */

import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { MenuButton, MenuPage, KeyboardLayout } from '@/types/Bot';
import { BUTTON_TEXTS, MENU_TEXTS } from '@/config/DefaultConfig';
import { GroupConfig } from '@/types/Config';

export class MenuBuilder {
    /**
     * 构建主菜单
     */
    static buildMainMenu(): MenuPage {
        return {
            title: MENU_TEXTS.MAIN_MENU.title,
            description: MENU_TEXTS.MAIN_MENU.description,
            type: 'main',
            buttons: [
                [
                    { text: BUTTON_TEXTS.GROUP_SETTINGS, callbackData: 'main_groups' },
                    { text: BUTTON_TEXTS.WELCOME_MESSAGE, callbackData: 'main_welcome' }
                ],
                [
                    { text: BUTTON_TEXTS.WELCOME_IMAGE, callbackData: 'main_image' },
                    { text: BUTTON_TEXTS.LINK_MANAGEMENT, callbackData: 'main_links' }
                ],
                [
                    { text: BUTTON_TEXTS.ADVANCED_SETTINGS, callbackData: 'main_advanced' },
                    { text: BUTTON_TEXTS.TEST_MESSAGE, callbackData: 'main_test' }
                ],
                [
                    { text: BUTTON_TEXTS.STATISTICS, callbackData: 'main_stats' },
                    { text: BUTTON_TEXTS.DONE_SETTINGS, callbackData: 'main_done' }
                ]
            ]
        };
    }

    /**
     * 构建群组设置菜单
     */
    static buildGroupSettingsMenu(groupConfigs: GroupConfig): MenuPage {
        const buttons: MenuButton[][] = [];
        const groups = Object.keys(groupConfigs);

        // 添加群组按钮（每行最多2个）
        for (let i = 0; i < groups.length; i += 2) {
            const row: MenuButton[] = [];
            
            const group1 = groups[i];
            const group1Name = group1 === 'default' ? '🌐 默认配置' : `📱 群组 ${group1}`;
            const group1Status = groupConfigs[group1]?.isEnabled ? '✅' : '❌';
            
            row.push({
                text: `${group1Status} ${group1Name}`,
                callbackData: `group_select_${group1}`
            });
            
            if (i + 1 < groups.length) {
                const group2 = groups[i + 1];
                const group2Name = group2 === 'default' ? '🌐 默认配置' : `📱 群组 ${group2}`;
                const group2Status = groupConfigs[group2]?.isEnabled ? '✅' : '❌';
                
                row.push({
                    text: `${group2Status} ${group2Name}`,
                    callbackData: `group_select_${group2}`
                });
            }
            
            buttons.push(row);
        }

        // 添加操作按钮
        buttons.push([
            { text: BUTTON_TEXTS.ADD_GROUP, callbackData: 'group_add' },
            { text: BUTTON_TEXTS.COPY_CONFIG, callbackData: 'group_copy' }
        ]);

        buttons.push([
            { text: BUTTON_TEXTS.BACK, callbackData: 'back_main' }
        ]);

        return {
            title: MENU_TEXTS.GROUP_MENU.title,
            description: MENU_TEXTS.GROUP_MENU.description,
            type: 'submenu',
            parent: 'main',
            buttons
        };
    }

    /**
     * 构建群组详细设置菜单
     */
    static buildGroupDetailMenu(groupId: string, config: any): MenuPage {
        const groupName = groupId === 'default' ? '默认配置' : `群组 ${groupId}`;
        
        const buttons: MenuButton[][] = [
            [
                {
                    text: config.isEnabled ? BUTTON_TEXTS.DISABLE : BUTTON_TEXTS.ENABLE,
                    callbackData: `toggle_${groupId}`
                },
                {
                    text: BUTTON_TEXTS.WELCOME_MESSAGE,
                    callbackData: `edit_text_${groupId}`
                }
            ],
            [
                {
                    text: BUTTON_TEXTS.WELCOME_IMAGE,
                    callbackData: `edit_image_${groupId}`
                },
                {
                    text: BUTTON_TEXTS.LINK_MANAGEMENT,
                    callbackData: `edit_links_${groupId}`
                }
            ],
            [
                {
                    text: BUTTON_TEXTS.ADVANCED_SETTINGS,
                    callbackData: `advanced_${groupId}`
                },
                {
                    text: BUTTON_TEXTS.TEST_MESSAGE,
                    callbackData: `test_${groupId}`
                }
            ]
        ];

        // 如果不是默认配置，添加删除按钮
        if (groupId !== 'default') {
            buttons.push([
                {
                    text: BUTTON_TEXTS.DELETE_GROUP,
                    callbackData: `delete_${groupId}`
                }
            ]);
        }

        buttons.push([
            { text: BUTTON_TEXTS.BACK, callbackData: 'main_groups' }
        ]);

        return {
            title: `📱 ${groupName} 详细设置`,
            description: this.buildGroupStatusDescription(config),
            type: 'submenu',
            parent: 'groups',
            buttons
        };
    }

    /**
     * 构建链接管理菜单
     */
    static buildLinksMenu(groupId: string, links: any[]): MenuPage {
        const buttons: MenuButton[][] = [];

        // 添加现有链接编辑按钮
        links.forEach((link, index) => {
            buttons.push([{
                text: `${link.emoji || '🔗'} ${link.text} - ${BUTTON_TEXTS.EDIT}`,
                callbackData: `link_edit_${groupId}_${index}`
            }]);
        });

        // 添加操作按钮
        buttons.push([
            { text: BUTTON_TEXTS.ADD_LINK, callbackData: `link_add_${groupId}` }
        ]);

        buttons.push([
            { text: BUTTON_TEXTS.BACK, callbackData: `group_select_${groupId}` }
        ]);

        return {
            title: MENU_TEXTS.LINK_MENU.title,
            description: this.buildLinksDescription(links),
            type: 'submenu',
            parent: 'group_detail',
            buttons
        };
    }

    /**
     * 构建链接编辑菜单
     */
    static buildLinkEditMenu(groupId: string, linkIndex: number, link: any): MenuPage {
        const buttons: MenuButton[][] = [
            [
                { text: '📝 编辑文本', callbackData: `link_edit_text_${groupId}_${linkIndex}` },
                { text: '🔗 编辑链接', callbackData: `link_edit_url_${groupId}_${linkIndex}` }
            ],
            [
                { text: '😀 编辑表情', callbackData: `link_edit_emoji_${groupId}_${linkIndex}` },
                { text: BUTTON_TEXTS.DELETE_LINK, callbackData: `link_delete_${groupId}_${linkIndex}` }
            ],
            [
                { text: BUTTON_TEXTS.BACK, callbackData: `edit_links_${groupId}` }
            ]
        ];

        return {
            title: '🔗 编辑链接',
            description: `当前链接:\n${link.emoji || '🔗'} ${link.text}\n${link.url}`,
            type: 'edit',
            parent: 'links',
            buttons
        };
    }

    /**
     * 构建高级设置菜单
     */
    static buildAdvancedMenu(groupId: string, config: any): MenuPage {
        const buttons: MenuButton[][] = [
            [
                {
                    text: `🗑️ 自动删除: ${config.autoDelete ? '启用' : '禁用'}`,
                    callbackData: `advanced_toggle_autodelete_${groupId}`
                }
            ],
            [
                {
                    text: `⏱️ 延迟发送: ${config.welcomeDelay || 0}秒`,
                    callbackData: `advanced_edit_delay_${groupId}`
                }
            ],
            [
                {
                    text: BUTTON_TEXTS.RESET,
                    callbackData: `advanced_reset_${groupId}`
                },
                {
                    text: BUTTON_TEXTS.EXPORT,
                    callbackData: `advanced_export_${groupId}`
                }
            ],
            [
                { text: BUTTON_TEXTS.BACK, callbackData: `group_select_${groupId}` }
            ]
        ];

        return {
            title: MENU_TEXTS.ADVANCED_MENU.title,
            description: MENU_TEXTS.ADVANCED_MENU.description,
            type: 'submenu',
            parent: 'group_detail',
            buttons
        };
    }

    /**
     * 构建统计信息菜单
     */
    static buildStatsMenu(stats: any): MenuPage {
        const buttons: MenuButton[][] = [
            [
                { text: '📊 群组统计', callbackData: 'stats_groups' },
                { text: '👥 用户统计', callbackData: 'stats_users' }
            ],
            [
                { text: '📈 性能统计', callbackData: 'stats_performance' },
                { text: '🔄 刷新数据', callbackData: 'stats_refresh' }
            ],
            [
                { text: BUTTON_TEXTS.EXPORT, callbackData: 'stats_export' },
                { text: BUTTON_TEXTS.BACK, callbackData: 'back_main' }
            ]
        ];

        return {
            title: MENU_TEXTS.STATS_MENU.title,
            description: this.buildStatsDescription(stats),
            type: 'submenu',
            parent: 'main',
            buttons
        };
    }

    /**
     * 构建确认对话框菜单
     */
    static buildConfirmationMenu(
        title: string,
        description: string,
        confirmCallback: string,
        cancelCallback: string,
        confirmText = BUTTON_TEXTS.CONFIRM,
        cancelText = BUTTON_TEXTS.CANCEL
    ): MenuPage {
        return {
            title,
            description,
            type: 'confirm',
            buttons: [
                [
                    { text: confirmText, callbackData: confirmCallback },
                    { text: cancelText, callbackData: cancelCallback }
                ]
            ]
        };
    }

    /**
     * 构建备份管理菜单
     */
    static buildBackupMenu(backups: any[]): MenuPage {
        const buttons: MenuButton[][] = [];

        // 添加最近的5个备份
        const recentBackups = backups.slice(0, 5);
        recentBackups.forEach((backup, index) => {
            const date = new Date(backup.timestamp).toLocaleDateString();
            buttons.push([{
                text: `📦 ${backup.filename} (${date})`,
                callbackData: `backup_restore_${backup.filename}`
            }]);
        });

        // 添加操作按钮
        buttons.push([
            { text: '💾 创建备份', callbackData: 'backup_create' },
            { text: '📋 查看全部', callbackData: 'backup_list_all' }
        ]);

        buttons.push([
            { text: BUTTON_TEXTS.BACK, callbackData: 'main_advanced' }
        ]);

        return {
            title: '💾 备份管理',
            description: `当前有 ${backups.length} 个备份文件`,
            type: 'submenu',
            parent: 'advanced',
            buttons
        };
    }

    /**
     * 构建帮助菜单
     */
    static buildHelpMenu(): MenuPage {
        const buttons: MenuButton[][] = [
            [
                { text: '📖 使用指南', callbackData: 'help_guide' },
                { text: '❓ 常见问题', callbackData: 'help_faq' }
            ],
            [
                { text: '🆘 故障排除', callbackData: 'help_troubleshoot' },
                { text: '📞 联系支持', callbackData: 'help_contact' }
            ],
            [
                { text: BUTTON_TEXTS.BACK, callbackData: 'back_main' }
            ]
        ];

        return {
            title: '📚 帮助中心',
            description: '选择您需要的帮助类型：',
            type: 'submenu',
            parent: 'main',
            buttons
        };
    }

    // 辅助方法

    /**
     * 构建群组状态描述
     */
    private static buildGroupStatusDescription(config: any): string {
        const status = config.isEnabled ? '✅ 启用' : '❌ 禁用';
        const linkCount = config.links?.length || 0;
        const autoDelete = config.autoDelete ? '启用' : '禁用';
        const delay = config.welcomeDelay || 0;

        return `**状态:** ${status}
**链接数量:** ${linkCount} 个
**自动删除:** ${autoDelete}
**延迟发送:** ${delay} 秒

选择要修改的设置：`;
    }

    /**
     * 构建链接描述
     */
    private static buildLinksDescription(links: any[]): string {
        if (links.length === 0) {
            return '当前没有配置链接\n\n点击"添加链接"开始配置：';
        }

        let description = '当前链接：\n\n';
        links.forEach((link, index) => {
            description += `${index + 1}. ${link.emoji || '🔗'} ${link.text}\n   ${link.url}\n\n`;
        });

        return description;
    }

    /**
     * 构建统计描述
     */
    private static buildStatsDescription(stats: any): string {
        return `**运行时间:** ${this.formatUptime(stats.uptime)}
**处理消息:** ${stats.totalMessages || 0}
**活跃群组:** ${stats.activeGroups || 0}
**欢迎次数:** ${stats.welcomeCount || 0}

点击查看详细统计：`;
    }

    /**
     * 格式化运行时间
     */
    private static formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}天 ${hours}小时 ${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else {
            return `${minutes}分钟`;
        }
    }

    /**
     * 构建分页按钮
     */
    static buildPaginationButtons(
        currentPage: number,
        totalPages: number,
        baseCallback: string
    ): MenuButton[] {
        const buttons: MenuButton[] = [];

        if (currentPage > 1) {
            buttons.push({
                text: '⬅️ 上一页',
                callbackData: `${baseCallback}_${currentPage - 1}`
            });
        }

        buttons.push({
            text: `📄 ${currentPage}/${totalPages}`,
            callbackData: 'noop'
        });

        if (currentPage < totalPages) {
            buttons.push({
                text: '➡️ 下一页',
                callbackData: `${baseCallback}_${currentPage + 1}`
            });
        }

        return buttons;
    }

    /**
     * 构建面包屑导航
     */
    static buildBreadcrumbs(currentPage: string, parents: string[]): string {
        const breadcrumbs = ['🏠 主菜单', ...parents, currentPage];
        return breadcrumbs.join(' > ');
    }

    /**
     * 验证菜单结构
     */
    static validateMenu(menu: MenuPage): boolean {
        if (!menu.title || !menu.buttons) {
            return false;
        }

        // 检查按钮数量限制
        if (menu.buttons.length > 10) {
            return false;
        }

        for (const row of menu.buttons) {
            if (row.length > 3) {
                return false;
            }

            for (const button of row) {
                if (!button.text || !button.callbackData) {
                    return false;
                }

                if (button.text.length > 64) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 优化菜单布局
     */
    static optimizeMenuLayout(buttons: MenuButton[]): MenuButton[][] {
        const optimized: MenuButton[][] = [];
        let currentRow: MenuButton[] = [];

        for (const button of buttons) {
            // 如果当前行已有2个按钮，或者按钮文本很长，则开始新行
            if (currentRow.length >= 2 || button.text.length > 30) {
                if (currentRow.length > 0) {
                    optimized.push([...currentRow]);
                    currentRow = [];
                }
            }

            currentRow.push(button);
        }

        if (currentRow.length > 0) {
            optimized.push(currentRow);
        }

        return optimized;
    }

    /**
     * 添加快速操作按钮
     */
    static addQuickActions(menu: MenuPage, groupId?: string): MenuPage {
        const quickActions: MenuButton[] = [];

        if (groupId) {
            quickActions.push({
                text: '🧪 快速测试',
                callbackData: `quick_test_${groupId}`
            });

            quickActions.push({
                text: '🔄 重新加载',
                callbackData: `quick_reload_${groupId}`
            });
        }

        if (quickActions.length > 0) {
            menu.buttons.push(quickActions);
        }

        return menu;
    }
}