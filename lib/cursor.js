"use strict";
var Carbon;
(function (Carbon) {
    let icons = {
        'zoom-in': `<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
    <circle cx="30" cy="30" r="29" stroke="#fff" stroke-width="2"/>
    <rect class="l1" x="29" y="20" width="2" height="20" rx="1" fill="#fff"/>
    <rect class="l2" x="40" y="29" width="2" height="20" rx="1" transform="rotate(90 40 29)" fill="#fff"/>
  </svg>`,
        'left-arrow': `<svg width="20" height="37" viewBox="0 0 20 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.3527 35L2.5895 20.2034C2.40267 20.0172 2.25443 19.796 2.15328 19.5524C2.05213 19.3088 2.00006 19.0476 2.00006 18.7839C2.00006 18.5201 2.05213 18.259 2.15328 18.0154C2.25443 17.7718 2.40267 17.5505 2.5895 17.3644L17.9539 1.99999" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
        'right-arrow': `<svg width="20" height="37" viewBox="0 0 20 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.06227 2L17.8254 16.7966C18.0123 16.9827 18.1605 17.204 18.2616 17.4476C18.3628 17.6912 18.4149 17.9523 18.4149 18.2161C18.4149 18.4799 18.3628 18.741 18.2616 18.9846C18.1605 19.2282 18.0123 19.4494 17.8254 19.6356L2.46105 35" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    };
    class Cursor {
        constructor(element, options) {
            this.type = 'zoom-in';
            this.properties = {
                scale: 1,
                rotate: 0,
                rotateY: 0
            };
            this.defaultScale = 0.7;
            this.reactive = new Carbon.Reactive();
            this.icon = 'zoom-in';
            this.mode = 'dynamic';
            this.hidden = false;
            this.element = element;
            this.type = 'zoom-in';
            if (options && options.scale) {
                this.defaultScale = options.scale;
            }
            this.properties.scale = this.defaultScale;
            this.animate(0);
        }
        static create(options = {}) {
            let el = document.createElement('div');
            let type = options.type || 'zoom-in';
            let style = `position:fixed;display:none;top:0;left:0;pointer-events:none;z-index:10000;`;
            if (options.blendMode) {
                style += 'mix-blend-mode:' + options.blendMode + ';';
            }
            el.innerHTML = `<div class="cursor" style="${style}">` + icons[type] + `</div>`;
            let parsedEl = el.firstElementChild;
            document.body.appendChild(parsedEl);
            return new Cursor(parsedEl, options);
        }
        async scale(value, options = {}) {
            if (this.properties.scale == value) {
                return true;
            }
            this.properties.scale = value;
            await this.animate();
        }
        async show() {
            this.hidden = false;
            this.element.style.opacity = '1';
            this.element.style.display = null;
        }
        async hide() {
            this.element.style.display = 'none';
            this.hidden = true;
        }
        check() {
            if (!this.lastEvent)
                return;
            let el = document.elementFromPoint(this.lastEvent.clientX, this.lastEvent.clientY);
            if (el) {
                let cursorEl = el.closest('[data-cursor]');
                if (cursorEl) {
                    cursorEl.style.cursor = 'none';
                    this.setType(cursorEl.dataset.cursor);
                    this.show();
                }
                else {
                    this.hide();
                }
            }
        }
        setType(value) {
            switch (value) {
                case 'zoom-in':
                    this.toZoomIn();
                    break;
                case 'zoom-out':
                    this.toZoomOut();
                    break;
                case 'close':
                    this.toClose();
                    break;
                case 'left-arrow':
                    this.toLeftArrow();
                    break;
                case 'right-arrow':
                    this.toRightArrow();
                    break;
            }
        }
        toZoomIn() {
            if (this.type == 'zoom-in')
                return Promise.resolve();
            this.setIcon('zoom-in');
            this.l1El.style.transition = 'height 100ms ease-out, opacity 100ms ease-out';
            this.l1El.style.height = '20px';
            this.l1El.style.opacity = '1';
            this.type = 'zoom-in';
            return this.rotate(0);
        }
        toZoomOut() {
            if (this.type == 'zoom-out') {
                return true;
            }
            this.setIcon('zoom-in');
            this.l1El.style.transition = 'height 100ms ease-out, opacity 100ms ease-out';
            this.l1El.style.height = '0px';
            this.l1El.style.opacity = '0';
            this.type = 'zoom-out';
            return this.rotate(0);
        }
        async toClose() {
            if (this.type == 'close') {
                return true;
            }
            this.setIcon('zoom-in');
            this.type = 'close';
            this.l1El.style.transition = 'height 100ms ease-out, opacity 100ms ease-out';
            this.l1El.style.height = '20px';
            this.l1El.style.opacity = '1';
            await this.rotate(45);
        }
        async toRightArrow() {
            if (this.type == 'right-arrow') {
                return true;
            }
            this.type = 'right-arrow';
            this.setIcon('right-arrow');
            this.properties.rotate = 0;
            this.properties.rotateY = 0;
            this.animate(0);
        }
        async toLeftArrow() {
            if (this.type == 'left-arrow')
                return;
            this.type = 'left-arrow';
            this.setIcon('left-arrow');
            this.properties.rotate = 0;
            this.properties.rotateY = 0;
            await this.animate(0);
        }
        get clientX() {
            if (!this.lastEvent)
                return 0;
            return this.lastEvent.clientX;
        }
        get clientY() {
            if (!this.lastEvent)
                return 0;
            return this.lastEvent.clientY;
        }
        onMouseMove(e) {
            if (!this.lastEvent || this.lastEvent && this.lastEvent.srcElement !== e.srcElement) {
                if (this.mode == 'dynamic') {
                    let el;
                    if (e.srcElement && (el = e.srcElement.closest('[data-cursor]'))) {
                        el.style.cursor = 'none';
                        this.setType(el.dataset['cursor']);
                        this.show();
                    }
                    else {
                        this.hide();
                    }
                }
                this.reactive.trigger({
                    type: 'hover',
                    target: e.srcElement
                });
            }
            this.reactive.trigger({
                type: 'move',
                target: e.srcElement,
                clientX: e.clientX,
                clientY: e.clientY
            });
            this.lastEvent = e;
            if (this.hidden)
                return;
            this.element.style.top = e.clientY + 'px';
            this.element.style.left = e.clientX + 'px';
        }
        on(name, e) {
            return this.reactive.on(name, e);
        }
        get position() {
            return {
                x: this.lastEvent.clientX,
                y: this.lastEvent.clientY
            };
        }
        stop() {
            this.mouseMoveListener && document.removeEventListener('mousemove', this.mouseMoveListener, false);
            this.mouseMoveListener = null;
        }
        start() {
            if (this.mouseMoveListener)
                return;
            this.mouseMoveListener = this.onMouseMove.bind(this);
            document.addEventListener('mousemove', this.mouseMoveListener, false);
            document.addEventListener('mousedown', this.onMouseDown.bind(this), false);
            document.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        }
        onMouseDown(e) {
            this.originalScale = this.properties.scale;
            this.properties.scale *= 1.2;
            this.animate(100);
        }
        onMouseUp(e) {
            this.properties.scale = this.originalScale;
            this.animate(100);
        }
        get svgEl() {
            return this.element.querySelector('svg');
        }
        get l1El() {
            return this.element.querySelector('.l1');
        }
        get l2El() {
            return this.element.querySelector('.l2');
        }
        setIcon(name) {
            if (this.icon != name) {
                this.icon = name;
                this.svgEl.outerHTML = icons[name];
            }
        }
        async rotateY(value) {
            if (this.properties.rotateY === value) {
                return true;
            }
            this.properties.rotateY = value;
            await this.animate();
        }
        async rotate(value) {
            if (this.properties.rotate === value) {
                return true;
            }
            this.properties.rotate = value;
            await this.animate();
        }
        animate(duration = 200) {
            this.element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
            this.element.style.transform = `translate(-30px,-30px) rotate(${this.properties.rotate}deg) rotateY(${this.properties.rotateY}deg) scale(${this.properties.scale})`;
            return new Promise((resolve, reject) => {
                setTimeout(resolve, duration);
            });
        }
    }
    Carbon.Cursor = Cursor;
})(Carbon || (Carbon = {}));
