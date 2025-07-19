/**
 * 键盘构建器
 */

import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { MenuPage, MenuButton, KeyboardLayout } from '@/types/Bot';
import { LinkButton } from '@/types/Config';

export class KeyboardBuilder {
    /**
     * 从菜单页面构建内联键盘
     */
    static fromMenuPage(menu: MenuPage): any {
        const keyboard = menu.buttons.map(row => 
            row.map(button => this.createInlineButton(button))
        );

        return Markup.inlineKeyboard(keyboard);
    }

    /**
     * 从按钮数组构建内联键盘
     */
    static fromButtons(buttons: MenuButton[][], layout: KeyboardLayout['layout'] = 'vertical'): any {
        let keyboard: InlineKeyboardButton[][];

        switch (layout) {
            case 'horizontal':
                keyboard = [buttons.flat().map(button => this.createInlineButton(button))];
                break;
            case 'grid':
                keyboard = buttons.map(row => 
                    row.map(button => this.createInlineButton(button))
                );
                break;
            case 'vertical':
            default:
                keyboard = buttons.map(row => 
                    row.map(button => this.createInlineButton(button))
                );
                break;
        }

        return Markup.inlineKeyboard(keyboard);
    }

    /**
     * 创建欢迎消息的链接键盘
     */
    static createWelcomeKeyboard(links: LinkButton[]): InlineKeyboardButton[][] {
        const keyboard: InlineKeyboardButton[][] = [];
        
        // 每行最多2个按钮
        for (let i = 0; i < links.length; i += 2) {
            const row: InlineKeyboardButton[] = [];
            
            const link1 = links[i];
            row.push({
                text: `${link1.emoji || ''} ${link1.text}`.trim(),
                url: link1.url
            });
            
            if (i + 1 < links.length) {
                const link2 = links[i + 1];
                row.push({
                    text: `${link2.emoji || ''} ${link2.text}`.trim(),
                    url: link2.url
                });
            }
            
            keyboard.push(row);
        }
        
        return keyboard;
    }

    /**
     * 创建单个内联按钮
     */
    private static createInlineButton(button: MenuButton): InlineKeyboardButton {
        if (button.isUrl && button.url) {
            return {
                text: button.text,
                url: button.url
            };
        } else {
            return {
                text: button.text,
                callback_data: button.callbackData
            };
        }
    }

    /**
     * 创建确认/取消键盘
     */
    static createConfirmationKeyboard(
        confirmCallback: string,
        cancelCallback: string,
        confirmText = '✅ 确认',
        cancelText = '❌ 取消'
    ): any {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(confirmText, confirmCallback),
                Markup.button.callback(cancelText, cancelCallback)
            ]
        ]);
    }

    /**
     * 创建是/否键盘
     */
    static createYesNoKeyboard(
        yesCallback: string,
        noCallback: string,
        yesText = '✅ 是',
        noText = '❌ 否'
    ): any {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(yesText, yesCallback),
                Markup.button.callback(noText, noCallback)
            ]
        ]);
    }

    /**
     * 创建数字选择键盘
     */
    static createNumberKeyboard(
        range: { min: number; max: number },
        callback: string,
        currentValue?: number
    ): any {
        const buttons: InlineKeyboardButton[][] = [];
        const { min, max } = range;
        
        // 创建数字按钮（每行3个）
        for (let i = min; i <= max; i += 3) {
            const row: InlineKeyboardButton[] = [];
            
            for (let j = 0; j < 3 && (i + j) <= max; j++) {
                const num = i + j;
                const text = currentValue === num ? `● ${num}` : String(num);
                
                row.push({
                    text,
                    callback_data: `${callback}_${num}`
                });
            }
            
            buttons.push(row);
        }

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建分页键盘
     */
    static createPaginationKeyboard(
        currentPage: number,
        totalPages: number,
        baseCallback: string,
        showPageInfo = true
    ): any {
        const buttons: InlineKeyboardButton[] = [];

        // 上一页按钮
        if (currentPage > 1) {
            buttons.push({
                text: '⬅️ 上一页',
                callback_data: `${baseCallback}_${currentPage - 1}`
            });
        }

        // 页码信息
        if (showPageInfo) {
            buttons.push({
                text: `📄 ${currentPage}/${totalPages}`,
                callback_data: 'noop'
            });
        }

        // 下一页按钮
        if (currentPage < totalPages) {
            buttons.push({
                text: '➡️ 下一页',
                callback_data: `${baseCallback}_${currentPage + 1}`
            });
        }

        return Markup.inlineKeyboard([buttons]);
    }

    /**
     * 创建快速选择键盘
     */
    static createQuickSelectKeyboard(
        options: Array<{ text: string; value: string }>,
        callback: string,
        selectedValue?: string
    ): any {
        const buttons = options.map(option => {
            const text = selectedValue === option.value 
                ? `● ${option.text}` 
                : option.text;
            
            return [Markup.button.callback(text, `${callback}_${option.value}`)];
        });

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建多选键盘
     */
    static createMultiSelectKeyboard(
        options: Array<{ text: string; value: string }>,
        callback: string,
        selectedValues: string[] = []
    ): any {
        const buttons = options.map(option => {
            const isSelected = selectedValues.includes(option.value);
            const text = isSelected 
                ? `☑️ ${option.text}` 
                : `☐ ${option.text}`;
            
            return [Markup.button.callback(text, `${callback}_${option.value}`)];
        });

        // 添加完成按钮
        buttons.push([
            Markup.button.callback('✅ 完成选择', `${callback}_done`)
        ]);

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建颜色选择键盘
     */
    static createColorKeyboard(callback: string, currentColor?: string): any {
        const colors = [
            { text: '🔴 红色', value: 'red' },
            { text: '🟠 橙色', value: 'orange' },
            { text: '🟡 黄色', value: 'yellow' },
            { text: '🟢 绿色', value: 'green' },
            { text: '🔵 蓝色', value: 'blue' },
            { text: '🟣 紫色', value: 'purple' },
            { text: '⚪ 白色', value: 'white' },
            { text: '⚫ 黑色', value: 'black' }
        ];

        const buttons = [];
        for (let i = 0; i < colors.length; i += 2) {
            const row = [];
            
            const color1 = colors[i];
            const text1 = currentColor === color1.value 
                ? `● ${color1.text}` 
                : color1.text;
            row.push(Markup.button.callback(text1, `${callback}_${color1.value}`));
            
            if (i + 1 < colors.length) {
                const color2 = colors[i + 1];
                const text2 = currentColor === color2.value 
                    ? `● ${color2.text}` 
                    : color2.text;
                row.push(Markup.button.callback(text2, `${callback}_${color2.value}`));
            }
            
            buttons.push(row);
        }

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建时间选择键盘
     */
    static createTimeKeyboard(callback: string, currentValue = 0): any {
        const timeOptions = [
            { text: '立即', value: 0 },
            { text: '5秒', value: 5 },
            { text: '10秒', value: 10 },
            { text: '30秒', value: 30 },
            { text: '1分钟', value: 60 },
            { text: '5分钟', value: 300 }
        ];

        const buttons = [];
        for (let i = 0; i < timeOptions.length; i += 2) {
            const row = [];
            
            const time1 = timeOptions[i];
            const text1 = currentValue === time1.value 
                ? `● ${time1.text}` 
                : time1.text;
            row.push(Markup.button.callback(text1, `${callback}_${time1.value}`));
            
            if (i + 1 < timeOptions.length) {
                const time2 = timeOptions[i + 1];
                const text2 = currentValue === time2.value 
                    ? `● ${time2.text}` 
                    : time2.text;
                row.push(Markup.button.callback(text2, `${callback}_${time2.value}`));
            }
            
            buttons.push(row);
        }

        // 添加自定义时间选项
        buttons.push([
            Markup.button.callback('⏱️ 自定义时间', `${callback}_custom`)
        ]);

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建开关键盘
     */
    static createToggleKeyboard(
        callback: string,
        isEnabled: boolean,
        enableText = '启用',
        disableText = '禁用'
    ): any {
        const buttons = [
            [
                Markup.button.callback(
                    isEnabled ? `● ${enableText}` : enableText,
                    `${callback}_true`
                ),
                Markup.button.callback(
                    !isEnabled ? `● ${disableText}` : disableText,
                    `${callback}_false`
                )
            ]
        ];

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建URL按钮键盘
     */
    static createUrlKeyboard(links: Array<{ text: string; url: string }>): any {
        const buttons = links.map(link => [
            Markup.button.url(link.text, link.url)
        ]);

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建混合键盘（回调按钮和URL按钮）
     */
    static createMixedKeyboard(
        items: Array<{
            text: string;
            type: 'callback' | 'url';
            data: string;
        }>
    ): any {
        const buttons = items.map(item => {
            if (item.type === 'url') {
                return [Markup.button.url(item.text, item.data)];
            } else {
                return [Markup.button.callback(item.text, item.data)];
            }
        });

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * 创建返回键盘
     */
    static createBackKeyboard(callback: string, text = '⬅️ 返回'): any {
        return Markup.inlineKeyboard([
            [Markup.button.callback(text, callback)]
        ]);
    }

    /**
     * 创建空键盘（移除键盘）
     */
    static createEmptyKeyboard(): any {
        return Markup.inlineKeyboard([]);
    }

    /**
     * 验证键盘结构
     */
    static validateKeyboard(keyboard: InlineKeyboardButton[][]): boolean {
        if (!Array.isArray(keyboard)) {
            return false;
        }

        // 检查最大行数
        if (keyboard.length > 100) {
            return false;
        }

        for (const row of keyboard) {
            if (!Array.isArray(row) || row.length === 0 || row.length > 8) {
                return false;
            }

            for (const button of row) {
                if (!button.text || button.text.length > 64) {
                    return false;
                }

                // 必须有回调数据或URL
                if (!button.callback_data && !button.url) {
                    return false;
                }

                // 回调数据长度限制
                if (button.callback_data && button.callback_data.length > 64) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 优化键盘布局
     */
    static optimizeKeyboard(buttons: InlineKeyboardButton[]): InlineKeyboardButton[][] {
        const optimized: InlineKeyboardButton[][] = [];
        let currentRow: InlineKeyboardButton[] = [];

        for (const button of buttons) {
            // 如果当前行已有按钮且按钮文本较长，开始新行
            if (currentRow.length > 0 && button.text.length > 20) {
                optimized.push([...currentRow]);
                currentRow = [button];
            }
            // 如果当前行已有2个按钮，开始新行
            else if (currentRow.length >= 2) {
                optimized.push([...currentRow]);
                currentRow = [button];
            }
            // 添加到当前行
            else {
                currentRow.push(button);
            }
        }

        if (currentRow.length > 0) {
            optimized.push(currentRow);
        }

        return optimized;
    }

    /**
     * 合并键盘
     */
    static mergeKeyboards(...keyboards: InlineKeyboardButton[][][]): InlineKeyboardButton[][] {
        const merged: InlineKeyboardButton[][] = [];

        for (const keyboard of keyboards) {
            merged.push(...keyboard);
        }

        return merged;
    }

    /**
     * 添加返回按钮到键盘
     */
    static addBackButton(
        keyboard: InlineKeyboardButton[][],
        callback: string,
        text = '⬅️ 返回'
    ): InlineKeyboardButton[][] {
        const result = [...keyboard];
        result.push([{
            text,
            callback_data: callback
        }]);

        return result;
    }
}