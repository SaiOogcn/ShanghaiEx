/**
 * ShanghaiEx - 制沪等级
 * 记录你走过的上海每一个区
 */
(function() {
    'use strict';

    // 存储键名
    var STORAGE_KEY = "shanghaiex-levels";
    
    // 等级颜色列表（从低到高）
    var LEVEL_COLORS = ["white", "blue", "green", "yellow", "orange", "red"];
    
    // 颜色对应分数
    var COLOR_SCORE = {
        white: 0,
        blue: 1,
        green: 2,
        yellow: 3,
        orange: 4,
        red: 5
    };
    
    // 当前选中的区
    var currentDistrict = null;
    
    // 区等级数据
    var districtLevels = {};
    
    // DOM 元素引用
    var form, formTitle, svg;

    /**
     * 初始化应用
     */
    function init() {
        form = document.querySelector(".form");
        formTitle = form.querySelector(".title .name");
        svg = document.getElementById("svg");
        
        loadLevels();
        bindEvents();
        renderAllLevels();
        calculate();
    }

    /**
     * 从 URL hash 或 localStorage 加载等级数据
     */
    function loadLevels() {
        // 优先从 URL hash 加载
        if (window.location.hash && window.location.hash.length > 1) {
            var hash = window.location.hash.substring(1);
            var districts = document.querySelectorAll(".district");
            var i = 0;
            districts.forEach(function(d) {
                if (hash[i] !== undefined) {
                    var level = parseInt(hash[i]) || 0;
                    districtLevels[d.id] = levelToColor(level);
                }
                i++;
            });
            return;
        }
        
        // 从 localStorage 加载
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                districtLevels = JSON.parse(saved);
            }
        } catch (e) {
            districtLevels = {};
        }
    }

    /**
     * 保存等级数据到 localStorage 和 URL hash
     */
    function saveLevels() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(districtLevels));
        } catch (e) {
            console.warn("无法保存到 localStorage");
        }
        updateHash();
    }

    /**
     * 更新 URL hash
     */
    function updateHash() {
        var districts = document.querySelectorAll(".district");
        var hash = "";
        districts.forEach(function(d) {
            var color = districtLevels[d.id] || "white";
            hash += COLOR_SCORE[color] || 0;
        });
        history.replaceState(null, "", "#" + hash);
    }

    /**
     * 将等级数字转换为颜色名称
     */
    function levelToColor(level) {
        var idx = Math.min(Math.max(0, level), 5);
        return LEVEL_COLORS[idx];
    }

    /**
     * 渲染所有区的等级颜色
     */
    function renderAllLevels() {
        var districts = document.querySelectorAll(".district");
        districts.forEach(function(district) {
            var color = districtLevels[district.id] || "white";
            LEVEL_COLORS.forEach(function(c) {
                district.classList.remove(c);
            });
            district.classList.add(color);
        });
    }

    /**
     * 设置区等级
     */
    function setDistrictLevel(districtName, color) {
        districtLevels[districtName] = color;
        saveLevels();
        
        var district = document.getElementById(districtName);
        if (district) {
            LEVEL_COLORS.forEach(function(c) {
                district.classList.remove(c);
            });
            district.classList.add(color);
        }
        calculate();
    }

    /**
     * 绑定事件监听器
     */
    function bindEvents() {
        // 区点击事件
        document.querySelectorAll(".district").forEach(function(district) {
            district.addEventListener("click", function(e) {
                e.stopPropagation();
                showForm(this.id, e.clientX, e.clientY);
            });
        });
        
        // 区标签点击事件
        document.querySelectorAll("#label text").forEach(function(label) {
            label.addEventListener("click", function(e) {
                e.stopPropagation();
                var place = this.getAttribute("data-place");
                if (place) {
                    showForm(place, e.clientX, e.clientY);
                }
            });
        });
        
        // 等级选择事件
        form.querySelectorAll(".level").forEach(function(label) {
            label.addEventListener("click", function(e) {
                e.stopPropagation();
                var color = this.dataset.level;
                if (currentDistrict && color) {
                    setDistrictLevel(currentDistrict, color);
                    updateFormSelection(color);
                }
            });
        });
        
        // 关闭按钮事件
        var closeBtn = form.querySelector(".close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                closeForm();
            });
        }
        
        // 点击其他区域关闭表单
        document.addEventListener("click", function(e) {
            if (!form.contains(e.target) && !e.target.classList.contains("district")) {
                closeForm();
            }
        });
        
        // 重置按钮
        var resetBtn = document.getElementById("btn-reset");
        if (resetBtn) {
            resetBtn.addEventListener("click", resetAll);
        }
        
        // 保存图片按钮
        var shareBtn = document.getElementById("btn-share");
        if (shareBtn) {
            shareBtn.addEventListener("click", saveAsImage);
        }
        
        // 设置名字按钮
        var nameBtn = document.getElementById("btn-name");
        if (nameBtn) {
            nameBtn.addEventListener("click", setAuthor);
        }
        
        // 键盘事件
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                closeForm();
            }
        });
    }

    /**
     * 显示选择表单
     */
    function showForm(districtName, x, y) {
        currentDistrict = districtName;
        formTitle.textContent = districtName;
        
        // 更新搜索链接
        var searchLink = form.querySelector(".title .search");
        if (searchLink) {
            searchLink.href = "https://www.baidu.com/s?wd=" + encodeURIComponent("上海" + districtName + " 景点");
        }
        
        // 更新选中状态
        var currentColor = districtLevels[districtName] || "white";
        updateFormSelection(currentColor);
        
        // 计算位置
        var left = x + 15;
        var top = y + 15;
        
        // 边界检测
        if (left + 220 > window.innerWidth) {
            left = x - 235;
        }
        if (top + 320 > window.innerHeight) {
            top = y - 320;
        }
        left = Math.max(10, left);
        top = Math.max(10, top);
        
        form.style.left = left + "px";
        form.style.top = top + "px";
        form.classList.add("show");
    }

    /**
     * 更新表单中的选中状态
     */
    function updateFormSelection(color) {
        form.querySelectorAll(".level").forEach(function(label) {
            label.classList.remove("selected");
            if (label.dataset.level === color) {
                label.classList.add("selected");
            }
        });
    }

    /**
     * 关闭选择表单
     */
    function closeForm() {
        form.classList.remove("show");
        currentDistrict = null;
    }

    /**
     * 计算总等级分数
     */
    function calculate() {
        var totalLevel = 0;
        
        for (var key in districtLevels) {
            var score = COLOR_SCORE[districtLevels[key]] || 0;
            totalLevel += score;
        }
        
        var levelEl = document.getElementById("level");
        if (levelEl) {
            levelEl.textContent = totalLevel;
        }
        
        // 更新页面标题
        document.title = "制沪等级 " + totalLevel;
        
        return totalLevel;
    }

    /**
     * 重置所有区等级
     */
    function resetAll() {
        if (confirm("确定要重置所有区的等级吗？此操作不可撤销。")) {
            districtLevels = {};
            saveLevels();
            renderAllLevels();
            calculate();
            closeForm();
        }
    }

    /**
     * 设置作者名
     */
    function setAuthor() {
        var params = new URLSearchParams(window.location.search);
        var currentName = params.get("t") || "";
        var newName = prompt("请输入您想要显示的名字：", currentName);
        
        if (newName !== null) {
            if (newName.trim()) {
                params.set("t", newName.trim());
            } else {
                params.delete("t");
            }
            
            var newUrl = window.location.pathname;
            if (params.toString()) {
                newUrl += "?" + params.toString();
            }
            if (window.location.hash) {
                newUrl += window.location.hash;
            }
            window.history.replaceState(null, "", newUrl);
        }
    }

    /**
     * 保存为图片
     */
    function saveAsImage() {
        var svgElement = document.getElementById("svg");
        
        // 克隆 SVG
        var svgClone = svgElement.cloneNode(true);
        
        // 直接给每个 path 元素设置内联样式
        var paths = svgClone.querySelectorAll(".district");
        paths.forEach(function(path) {
            var currentFill = path.style.fill || "#ffffff";
            // 获取当前填充色
            if (path.classList.contains("red")) currentFill = "#e84c3d";
            else if (path.classList.contains("orange")) currentFill = "#d58337";
            else if (path.classList.contains("yellow")) currentFill = "#f3c218";
            else if (path.classList.contains("green")) currentFill = "#30cc70";
            else if (path.classList.contains("blue")) currentFill = "#3598db";
            else currentFill = "#ffffff";
            
            path.setAttribute("style", "fill: " + currentFill + "; stroke: #000; stroke-width: 0.3;");
        });
        
        // 内联样式到 SVG
        var styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleElement.textContent = `
            #label text, .labels text { font-size: 1.8px; fill: #333; font-family: sans-serif; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
            text { font-size: 1.8px; fill: #333; font-family: sans-serif; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
        `;
        svgClone.insertBefore(styleElement, svgClone.firstChild);
        
        // 设置 SVG 尺寸属性
        svgClone.setAttribute("width", "800");
        svgClone.setAttribute("height", "960");
        
        // 获取 SVG 数据
        var svgData = new XMLSerializer().serializeToString(svgClone);
        var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        var url = URL.createObjectURL(svgBlob);
        
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var img = new Image();
        
        img.onload = function() {
            // 设置画布尺寸
            var headerHeight = 70;
            var footerHeight = 50;
            var mapWidth = 800;
            var mapHeight = 960;
            canvas.width = mapWidth;
            canvas.height = headerHeight + mapHeight + footerHeight;
            
            // 绘制背景
            ctx.fillStyle = "#9dc3fb";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制地图
            ctx.drawImage(img, 0, headerHeight, mapWidth, mapHeight);
            
            // 绘制顶部背景条
            ctx.fillStyle = "#9dc3fb";
            ctx.fillRect(0, 0, canvas.width, headerHeight);
            
            // 绘制标题
            ctx.fillStyle = "#333";
            ctx.font = "bold 34px 'Noto Sans SC', sans-serif";
            ctx.textAlign = "center";
            
            // 从 URL 参数获取名字
            var params = new URLSearchParams(window.location.search);
            var authorName = params.get("t") || "";
            var level = calculate();
            var title = authorName 
                ? authorName + " 的制沪等级 " + level 
                : "制沪等级 " + level;
            
            ctx.fillText(title, canvas.width / 2, 45);
            
            // 绘制底部背景条
            ctx.fillStyle = "#9dc3fb";
            ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);
            
            // 绘制图例
            var legendY = canvas.height - 28;
            var legendColors = [
                { color: "#e84c3d", name: "常驻(曾居住)" },
                { color: "#d58337", name: "宿泊(曾过夜)" },
                { color: "#f3c218", name: "访问(曾游玩)" },
                { color: "#30cc70", name: "歇脚(曾换乘)" },
                { color: "#3598db", name: "行径(曾路过)" },
                { color: "#ffffff", name: "未履" }
            ];
            
            ctx.font = "13px 'Noto Sans SC', sans-serif";
            ctx.textAlign = "left";
            
            var legendX = 50;
            var spacing = 120;
            
            legendColors.forEach(function(item, index) {
                var x = legendX + index * spacing;
                
                // 绘制颜色圆点
                ctx.beginPath();
                ctx.arc(x, legendY, 8, 0, Math.PI * 2);
                ctx.fillStyle = item.color;
                ctx.fill();
                ctx.strokeStyle = "#666";
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // 绘制文字
                ctx.fillStyle = "#333";
                ctx.fillText(item.name, x + 14, legendY + 4);
            });
            
            // 绘制水印
            ctx.fillStyle = "#666";
            ctx.font = "11px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("ShanghaiEx · 制沪等级", canvas.width - 10, canvas.height - 8);
            
            // 下载图片
            var link = document.createElement("a");
            link.download = "ShanghaiEx_Level_" + level + ".png";
            link.href = canvas.toDataURL("image/png");
            link.click();
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = function() {
            alert("生成图片失败，请稍后重试");
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    // 初始化
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
