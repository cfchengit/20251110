let colors = ['#f71735', '#067bc2', '#FFC247', '#3BD89F', '#81cfe5', '#f654a9'];
let shapes = [];
let objs = [];
let ctx;
let sideMenu;

// 文字動畫變數
const AnimationState = {
	ANIMATING_IN: 'animating_in',
	WAITING_AT_CENTER: 'waiting_at_center',
	ANIMATING_OUT: 'animating_out',
};
let currentAnimationState = AnimationState.ANIMATING_IN;
let textY;
let animationStartTime;
let waitStartTime;
const animationDurationIn = 2000; // 進入動畫持續時間 (毫秒)
const waitDuration = 5000; // 在中間等待的時間 (毫秒)
const animationDurationOut = 5000; // 離開動畫持續時間 (毫秒)

function easeOutBounce(x) {
	const n1 = 7.5625;
	const d1 = 2.75;
	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

function easeInOutBack(x) {
	const c1 = 1.70158;
	const c2 = c1 * 1.525;

	return x < 0.5
		? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
		: (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

function setup() {
	createCanvas(windowWidth * 0.9, windowHeight * 0.95);
	rectMode(CENTER);
	ctx = drawingContext;
	initialize();
	animationStartTime = millis();
}

function draw() {
	background('#121220');

	// 檢查滑鼠位置並控制選單
	if (sideMenu) {
		if (winMouseX < 300) { // 當滑鼠在選單區域內 (寬度 300px)
			sideMenu.addClass('menu-visible'); // 顯示選單
			
		} else { // 否則就隱藏選單
			sideMenu.removeClass('menu-visible');
		}
	}

	for (let o of objs) {
		o.run();
	}

	// 更新並繪製文字
	const currentTime = millis();
	let elapsedTime;
	let progress;

	switch (currentAnimationState) {
		case AnimationState.ANIMATING_IN:
			elapsedTime = currentTime - animationStartTime;
			progress = Math.min(elapsedTime / animationDurationIn, 1);
			textY = lerp(0, height / 2, easeOutBounce(progress));
			if (progress >= 1) {
				currentAnimationState = AnimationState.WAITING_AT_CENTER;
				waitStartTime = currentTime;
			}
			break;
		case AnimationState.WAITING_AT_CENTER:
			if (currentTime - waitStartTime > waitDuration) {
				currentAnimationState = AnimationState.ANIMATING_OUT;
				animationStartTime = currentTime;
			}
			break;
		case AnimationState.ANIMATING_OUT:
			elapsedTime = currentTime - animationStartTime;
			progress = Math.min(elapsedTime / animationDurationOut, 1);
			textY = lerp(height / 2, height, easeInOutBack(progress));
			if (progress >= 1) {
				// 重置動畫
				currentAnimationState = AnimationState.ANIMATING_IN;
				animationStartTime = currentTime;
			}
			break;
	}

	fill(255); // 設定文字顏色為白色
	noStroke();
	textFont('Noto Sans TC'); // 使用 Noto Sans TC 字型
	textSize(64); // 設定一個較大的字體大小
	textAlign(CENTER, CENTER);
	text('淡江大學', width / 2, textY);

	if (frameCount % 400 == 0) {
		initialize();
	}
}

function checkRectCollision(a, b) {
	return (
		a.x - a.w / 2 < b.x + b.w / 2 &&
		a.x + a.w / 2 > b.x - b.w / 2 &&
		a.y - a.h / 2 < b.y + b.h / 2 &&
		a.y + a.h / 2 > b.y - b.h / 2
	);
}

function checkCircleCollision(a, b) {
	let distSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
	let radiusSum = (a.w / 2) + (b.w / 2);
	return distSq < radiusSum ** 2;
}

function checkCircleRectCollision(circle, rect) {
	let nearestX = constrain(circle.x, rect.x - rect.w / 2, rect.x + rect.w / 2);
	let nearestY = constrain(circle.y, rect.y - rect.h / 2, rect.y + rect.h / 2);
	let distSq = (circle.x - nearestX) ** 2 + (circle.y - nearestY) ** 2;
	return distSq < (circle.w / 2) ** 2;
}

function checkCollision(a, b) {
	if (a.t == 0 && b.t == 0) return checkRectCollision(a, b);
	if (a.t == 1 && b.t == 1) return checkCircleCollision(a, b);
	return a.t == 0
		? checkCircleRectCollision(b, a)
		: checkCircleRectCollision(a, b);
}

function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function initialize() {
	shapes = [];
	objs = [];
	let n = 15;

	// 創建選單 (如果尚未創建)
	if (!sideMenu) {
		let menuHTML = `
			<a id="show-iframe-btn" href="#">第一單元作品</a>
			<a id="show-iframe-btn-2" href="#">第一單元講義</a>
			<a id="show-iframe-btn-3" href="#">測驗系統</a>
			<a id="show-iframe-btn-4" href="#">測驗卷筆記</a>
			<a id="show-iframe-btn-5" href="#">作品筆記</a>
			<div class="menu-item">
				<a id="show-iframe-btn-tku" href="#">淡江大學</a>
				<div class="submenu"><a id="show-iframe-btn-ed-tech" href="#">教育科技學系</a></div>
			</div>
			<a href="index.html">回到首頁</a>`;
		sideMenu = createDiv(menuHTML);
		sideMenu.id('side-menu');

		// 綁定點擊事件來顯示 iframe
		select('#show-iframe-btn').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://cfchengit.github.io/20251020/');
			iframeContainer.style('display', 'flex');
		});

		select('#show-iframe-btn-2').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://hackmd.io/@cfchen/SJDlPQAsxx');
			iframeContainer.style('display', 'flex');
		});

		select('#show-iframe-btn-3').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://cfchengit.github.io/20251103/');
			iframeContainer.style('display', 'flex');
		});

		select('#show-iframe-btn-4').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://hackmd.io/@cfchen/SJomYtHyWx');
			iframeContainer.style('display', 'flex');
		});

		select('#show-iframe-btn-5').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://hackmd.io/@cfchen/SJ-bt0E1be');
			iframeContainer.style('display', 'flex');
		});
		select('#show-iframe-btn-tku').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://www.tku.edu.tw');
			iframeContainer.style('display', 'flex');
		});

		select('#show-iframe-btn-ed-tech').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			const iframe = select('#content-iframe');
			iframe.attribute('src', 'https://hackmd.io/@cfchen/SJomYtHyWx');
			iframeContainer.style('display', 'flex');
		});
		// 綁定點擊事件來隱藏 iframe
		select('#close-iframe-btn').mousePressed(function() {
			const iframeContainer = select('#iframe-container');
			iframeContainer.style('display', 'none');
		});
	}

	for (let i = 0; i < 10000; i++) {
		let x = (width / n) * int(random((n + 1)));
		let y = (height / n) * int(random((n + 1)));
		let w = (width / (n + 2)) * int(random(3) + 1);
		let h = (width / (n + 2)) * int(random(3) + 1);
		let clr = random(colors)
		if (random() < .5) {
			let tmp = w;
			w = h;
			h = tmp
		}
		let type = int(random(2));
		let newShape = { x, y, w: w, h: h, t: type, clr: clr };
		let overlap = false;
		for (let s of shapes) {
			if (checkCollision(newShape, s)) {
				overlap = true;
				break;
			}
		}
		if (!overlap) shapes.push(newShape);
	}

	for (let s of shapes) {
		objs.push(new OneStroke(s.x, s.y, s.w - width * 0.01, s.h - width * 0.01, s.t, s.clr));
	}
}

class OneStroke {
	constructor(x, y, w, h, type, clr) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.t = -int(random(150));
		this.t1 = 40;
		this.t2 = this.t1 + 150;
		this.t3 = this.t2 + 40;
		this.type = type;
		this.clr = clr;
		this.circumference = PI * this.w;
		if (this.type == 0) {
			this.circumference = (this.w + this.h) * 2;
		}
		this.amount = 0;
		this.vr = random([-1, 1]);
		this.hr = random([-1, 1]);
	}

	show() {
		push();
		translate(this.x, this.y);
		scale(this.vr, this.hr);
		ctx.setLineDash([this.circumference, this.circumference]);
		ctx.lineDashOffset = this.circumference + (this.circumference * this.amount);
		noFill();
		stroke(this.clr);
		strokeWeight(width * 0.01);
		if (this.type == 0) {
			rect(0, 0, this.w, this.h, width * 0.005);
		} else if (this.type == 1) {
			circle(0, 0, this.w);
		}
		pop();

	}

	move() {
		this.t++;
		if (0 < this.t && this.t < this.t1) {
			let n = norm(this.t, 0, this.t1 - 1);
			this.amount = easeInOutCubic(n);
		} else if (this.t2 < this.t && this.t < this.t3) {
			let n = norm(this.t, this.t2, this.t3 - 1);
			this.amount = easeInOutCubic(1 - n);
		}
	}

	run() {
		this.show();
		this.move();
	}
}
