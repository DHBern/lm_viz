
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var data3 = [
    	{
    		Label: "donec0",
    		Legend: "cras sem neque nec donec sit proin habitasse",
    		Coords: [
    			1705.66650390625,
    			-566.0387573242188,
    			-252.7596435546875
    		]
    	},
    	{
    		Label: "donec1",
    		Legend: "convallis semper donec elementum quis nunc tincidunt ac",
    		Coords: [
    			685.9598388671875,
    			716.2805786132812,
    			-322.40338134765625
    		]
    	},
    	{
    		Label: "donec2",
    		Legend: "donec justo volutpat in neque praesent varius ultrices",
    		Coords: [
    			1100.7418212890625,
    			-284.65631103515625,
    			1279.4847412109375
    		]
    	},
    	{
    		Label: "donec3",
    		Legend: "donec nisi id velit turpis augue odio fermentum",
    		Coords: [
    			111.3177490234375,
    			69.48560333251953,
    			1871.8463134765625
    		]
    	},
    	{
    		Label: "donec4",
    		Legend: "orci dui sociis ante donec diam ut pellentesque",
    		Coords: [
    			-290.7204284667969,
    			27.00762367248535,
    			154.17181396484375
    		]
    	},
    	{
    		Label: "donec5",
    		Legend: "donec diam ornare donec nunc neque lectus erat",
    		Coords: [
    			831.0894165039062,
    			913.0575561523438,
    			1349.5433349609375
    		]
    	},
    	{
    		Label: "donec6",
    		Legend: "donec diam ornare donec nunc neque lectus erat",
    		Coords: [
    			1046.3797607421875,
    			-246.20509338378906,
    			-1643.5833740234375
    		]
    	},
    	{
    		Label: "donec7",
    		Legend: "molestie aenean tortor vitae leo luctus lacus donec",
    		Coords: [
    			-480.7792663574219,
    			812.6502075195312,
    			-1251.5196533203125
    		]
    	},
    	{
    		Label: "donec8",
    		Legend: "nulla nulla id adipiscing et pede maecenas donec",
    		Coords: [
    			-327.870849609375,
    			-813.2905883789062,
    			-876.9862060546875
    		]
    	},
    	{
    		Label: "donec9",
    		Legend: "odio non libero blandit nec tristique donec ligula",
    		Coords: [
    			-1189.973876953125,
    			604.2787475585938,
    			171.2095489501953
    		]
    	},
    	{
    		Label: "donec10",
    		Legend: "odio luctus arcu rutrum accumsan donec blandit id",
    		Coords: [
    			-1082.98291015625,
    			-206.67515563964844,
    			-1266.8076171875
    		]
    	},
    	{
    		Label: "donec11",
    		Legend: "ipsum in sapien morbi donec augue nisi et",
    		Coords: [
    			-1123.65576171875,
    			-1055.2132568359375,
    			680.3493041992188
    		]
    	}
    ];

    /* src\App.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (134:3) {#each data as point (point.Label)}
    function create_each_block_2(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*point*/ ctx[22].Label + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*point*/ ctx[22].Legend + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[7](/*point*/ ctx[22]);
    	}

    	function mouseleave_handler() {
    		return /*mouseleave_handler*/ ctx[8](/*point*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(td0, "class", "svelte-11xc8po");
    			add_location(td0, file, 135, 5, 4342);
    			attr_dev(td1, "class", "svelte-11xc8po");
    			add_location(td1, file, 136, 5, 4371);
    			attr_dev(tr, "id", /*point*/ ctx[22].Label);
    			attr_dev(tr, "class", "svelte-11xc8po");
    			toggle_class(tr, "selected", /*point*/ ctx[22].Label === /*selectedItem*/ ctx[3]);
    			add_location(tr, file, 134, 4, 4152);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(tr, "mouseenter", mouseenter_handler, false, false, false),
    					listen_dev(tr, "mouseleave", mouseleave_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, selectedItem*/ 8) {
    				toggle_class(tr, "selected", /*point*/ ctx[22].Label === /*selectedItem*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(134:3) {#each data as point (point.Label)}",
    		ctx
    	});

    	return block;
    }

    // (149:3) {#each data2 as point (point.Label)}
    function create_each_block_1(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*point*/ ctx[22].Label + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*point*/ ctx[22].Legend + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function mouseenter_handler_1() {
    		return /*mouseenter_handler_1*/ ctx[10](/*point*/ ctx[22]);
    	}

    	function mouseleave_handler_1() {
    		return /*mouseleave_handler_1*/ ctx[11](/*point*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(td0, "class", "svelte-11xc8po");
    			add_location(td0, file, 150, 5, 4832);
    			attr_dev(td1, "class", "svelte-11xc8po");
    			add_location(td1, file, 151, 5, 4861);
    			attr_dev(tr, "id", /*point*/ ctx[22].Label);
    			attr_dev(tr, "class", "svelte-11xc8po");
    			toggle_class(tr, "selected", /*point*/ ctx[22].Label === /*selectedItem*/ ctx[3]);
    			add_location(tr, file, 149, 4, 4642);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(tr, "mouseenter", mouseenter_handler_1, false, false, false),
    					listen_dev(tr, "mouseleave", mouseleave_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data2, selectedItem*/ 8) {
    				toggle_class(tr, "selected", /*point*/ ctx[22].Label === /*selectedItem*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(149:3) {#each data2 as point (point.Label)}",
    		ctx
    	});

    	return block;
    }

    // (164:3) {#each data3 as point (point.Label)}
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*point*/ ctx[22].Label + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*point*/ ctx[22].Legend + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function mouseenter_handler_2() {
    		return /*mouseenter_handler_2*/ ctx[13](/*point*/ ctx[22]);
    	}

    	function mouseleave_handler_2() {
    		return /*mouseleave_handler_2*/ ctx[14](/*point*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(td0, "class", "svelte-11xc8po");
    			add_location(td0, file, 165, 5, 5323);
    			attr_dev(td1, "class", "svelte-11xc8po");
    			add_location(td1, file, 166, 5, 5352);
    			attr_dev(tr, "id", /*point*/ ctx[22].Label);
    			attr_dev(tr, "class", "svelte-11xc8po");
    			toggle_class(tr, "selected", /*point*/ ctx[22].Label === /*selectedItem*/ ctx[3]);
    			add_location(tr, file, 164, 4, 5133);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(tr, "mouseenter", mouseenter_handler_2, false, false, false),
    					listen_dev(tr, "mouseleave", mouseleave_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data3, selectedItem*/ 8) {
    				toggle_class(tr, "selected", /*point*/ ctx[22].Label === /*selectedItem*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(164:3) {#each data3 as point (point.Label)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let div1;
    	let table0;
    	let tr0;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let each_blocks_2 = [];
    	let each0_lookup = new Map();
    	let t9;
    	let div0;
    	let t10;
    	let div3;
    	let table1;
    	let tr1;
    	let th2;
    	let t12;
    	let th3;
    	let t14;
    	let each_blocks_1 = [];
    	let each1_lookup = new Map();
    	let t15;
    	let div2;
    	let t16;
    	let div5;
    	let table2;
    	let tr2;
    	let th4;
    	let t18;
    	let th5;
    	let t20;
    	let each_blocks = [];
    	let each2_lookup = new Map();
    	let t21;
    	let div4;
    	let mounted;
    	let dispose;
    	let each_value_2 = data3;
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*point*/ ctx[22].Label;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_2[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value_1 = data3;
    	validate_each_argument(each_value_1);
    	const get_key_1 = ctx => /*point*/ ctx[22].Label;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key_1);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
    	}

    	let each_value = data3;
    	validate_each_argument(each_value);
    	const get_key_2 = ctx => /*point*/ ctx[22].Label;
    	validate_each_keys(ctx, each_value, get_each_context, get_key_2);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Visualizing Language Models";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Language models (e.g. character embeddings) are essential to succeed in NLP tasks. Especially when it comes to Part-of-Speech and Named Entity Recognition, tasks result in more precise models if supported by adequate language models already. Since the advent of word2vec and large transformer-based language models (such as BERT or GPT-3) a variety of specialized and fine-tuned language models is currently available. Despite the widespread use and the necessity when it comes to specific model training (e.g. for language entities with only sparse data), our understanding of the models themselves is limited at best. In order to strengthen our understanding of language models and to start the process of reflecting them, this challenge asks for creative ways of visualizing language models. We envision 3D-visualizations based on dimension reduction to identify the positioning of e.g. synonym/homonyms in vector spaces or listing of semantic fields (neighboring vector values). For context insensitive approaches (e.g. word2vec or GloVe) we imagine to use the fixed vectors and represent calculations in grids.";
    			t4 = space();
    			div1 = element("div");
    			table0 = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Label";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Sentence";
    			t8 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t9 = space();
    			div0 = element("div");
    			t10 = space();
    			div3 = element("div");
    			table1 = element("table");
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Label";
    			t12 = space();
    			th3 = element("th");
    			th3.textContent = "Sentence";
    			t14 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			div2 = element("div");
    			t16 = space();
    			div5 = element("div");
    			table2 = element("table");
    			tr2 = element("tr");
    			th4 = element("th");
    			th4.textContent = "Label";
    			t18 = space();
    			th5 = element("th");
    			th5.textContent = "Sentence";
    			t20 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t21 = space();
    			div4 = element("div");
    			if (script.src !== (script_src_value = "https://cdn.plot.ly/plotly-latest.min.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 121, 1, 2729);
    			attr_dev(h1, "class", "svelte-11xc8po");
    			add_location(h1, file, 125, 1, 2846);
    			add_location(p, file, 126, 1, 2885);
    			add_location(th0, file, 130, 4, 4059);
    			add_location(th1, file, 131, 4, 4079);
    			add_location(tr0, file, 129, 3, 4049);
    			add_location(table0, file, 128, 2, 4037);
    			attr_dev(div0, "id", "myDiv");
    			attr_dev(div0, "class", "viz");
    			add_location(div0, file, 140, 2, 4433);
    			attr_dev(div1, "class", "container svelte-11xc8po");
    			add_location(div1, file, 127, 1, 4010);
    			add_location(th2, file, 145, 4, 4548);
    			add_location(th3, file, 146, 4, 4568);
    			add_location(tr1, file, 144, 3, 4538);
    			add_location(table1, file, 143, 2, 4526);
    			attr_dev(div2, "id", "myDiv2");
    			attr_dev(div2, "class", "viz");
    			add_location(div2, file, 155, 2, 4923);
    			attr_dev(div3, "class", "container svelte-11xc8po");
    			add_location(div3, file, 142, 1, 4499);
    			add_location(th4, file, 160, 4, 5039);
    			add_location(th5, file, 161, 4, 5059);
    			add_location(tr2, file, 159, 3, 5029);
    			add_location(table2, file, 158, 2, 5017);
    			attr_dev(div4, "id", "myDiv3");
    			attr_dev(div4, "class", "viz");
    			add_location(div4, file, 170, 2, 5414);
    			attr_dev(div5, "class", "container svelte-11xc8po");
    			add_location(div5, file, 157, 1, 4990);
    			attr_dev(main, "class", "svelte-11xc8po");
    			add_location(main, file, 124, 0, 2837);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t2);
    			append_dev(main, p);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(div1, table0);
    			append_dev(table0, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t6);
    			append_dev(tr0, th1);
    			append_dev(table0, t8);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(table0, null);
    			}

    			append_dev(div1, t9);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[9](div0);
    			append_dev(main, t10);
    			append_dev(main, div3);
    			append_dev(div3, table1);
    			append_dev(table1, tr1);
    			append_dev(tr1, th2);
    			append_dev(tr1, t12);
    			append_dev(tr1, th3);
    			append_dev(table1, t14);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(table1, null);
    			}

    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			/*div2_binding*/ ctx[12](div2);
    			append_dev(main, t16);
    			append_dev(main, div5);
    			append_dev(div5, table2);
    			append_dev(table2, tr2);
    			append_dev(tr2, th4);
    			append_dev(tr2, t18);
    			append_dev(tr2, th5);
    			append_dev(table2, t20);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table2, null);
    			}

    			append_dev(div5, t21);
    			append_dev(div5, div4);
    			/*div4_binding*/ ctx[15](div4);

    			if (!mounted) {
    				dispose = listen_dev(script, "load", /*initializeViz*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data, selectedItem, selectPoint, canvas1, deselectPoint*/ 105) {
    				each_value_2 = data3;
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key, 1, ctx, each_value_2, each0_lookup, table0, destroy_block, create_each_block_2, null, get_each_context_2);
    			}

    			if (dirty & /*data2, selectedItem, selectPoint, canvas2, deselectPoint*/ 106) {
    				each_value_1 = data3;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key_1);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_1, 1, ctx, each_value_1, each1_lookup, table1, destroy_block, create_each_block_1, null, get_each_context_1);
    			}

    			if (dirty & /*data3, selectedItem, selectPoint, canvas3, deselectPoint*/ 108) {
    				each_value = data3;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key_2);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_2, 1, ctx, each_value, each2_lookup, table2, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].d();
    			}

    			/*div0_binding*/ ctx[9](null);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			/*div2_binding*/ ctx[12](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div4_binding*/ ctx[15](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const trace1 = {
    		x: data3.map(o => o.Coords[0]),
    		y: data3.map(o => o.Coords[1]),
    		z: data3.map(o => o.Coords[2]),
    		marker: {
    			size: 12,
    			line: {
    				color: "rgba(217, 217, 217, 0.14)",
    				width: 0.5
    			},
    			opacity: 0.8
    		},
    		mode: "markers",
    		type: "scatter3d",
    		name: "Dataset 1",
    		text: [...data3.map(o => o.Label)],
    		hovertemplate: "%{text}<extra></extra>",
    		showLegend: false
    	};

    	const trace2 = {
    		x: data3.map(o => o.Coords[0]),
    		y: data3.map(o => o.Coords[1]),
    		z: data3.map(o => o.Coords[2]),
    		marker: {
    			size: 12,
    			line: {
    				color: "rgba(217, 217, 217, 0.14)",
    				width: 0.5
    			},
    			opacity: 0.8
    		},
    		mode: "markers",
    		type: "scatter3d",
    		name: "Dataset 1",
    		text: [...data3.map(o => o.Label)],
    		hovertemplate: "%{text}<extra></extra>",
    		showLegend: false
    	};

    	const trace3 = {
    		x: data3.map(o => o.Coords[0]),
    		y: data3.map(o => o.Coords[1]),
    		z: data3.map(o => o.Coords[2]),
    		marker: {
    			size: 12,
    			line: {
    				color: "rgba(217, 217, 217, 0.14)",
    				width: 0.5
    			},
    			opacity: 0.8
    		},
    		mode: "markers",
    		type: "scatter3d",
    		name: "Dataset 1",
    		text: [...data3.map(o => o.Label)],
    		hovertemplate: "%{text}<extra></extra>",
    		showLegend: false
    	};

    	const layout = {
    		hovermode: "closest",
    		margin: { l: 0, r: 0, b: 0, t: 0 }
    	};

    	let canvas1;
    	let canvas2;
    	let canvas3;
    	let selectedItem = "";

    	const initializeViz = () => {
    		Plotly.newPlot(canvas1, [trace1], layout, { showSendToCloud: true });
    		canvas1.on("plotly_hover", vizHover);
    		canvas1.on("plotly_unhover", vizUnhover);
    		Plotly.newPlot(canvas2, [trace2], layout, { showSendToCloud: true });
    		canvas2.on("plotly_hover", vizHover);
    		canvas2.on("plotly_unhover", vizUnhover);
    		Plotly.newPlot(canvas3, [trace3], layout, { showSendToCloud: true });
    		canvas3.on("plotly_hover", vizHover);
    		canvas3.on("plotly_unhover", vizUnhover);
    	};

    	function vizHover(event) {
    		console.log(event);

    		if (selectedItem !== event.points[0].text) {
    			$$invalidate(3, selectedItem = event.points[0].text);
    		}
    	}

    	function vizUnhover(event) {
    		$$invalidate(3, selectedItem = "");
    	}

    	const selectPoint = (point, canvasRef) => {
    		let index = data3.map(o => o.Label).indexOf(point);
    		let colorArray = new Array(data3.length).fill("grey");
    		colorArray[index] = "red";
    		Plotly.restyle(canvasRef, "marker.color", [colorArray]);
    	};

    	const deselectPoint = (point, canvasRef) => {
    		let colorArray = new Array(data3.length).fill("blue");
    		Plotly.restyle(canvasRef, "marker.color", [colorArray]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = point => selectPoint(point.Label, canvas1);
    	const mouseleave_handler = point => deselectPoint(point.Label, canvas1);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas1 = $$value;
    			$$invalidate(0, canvas1);
    		});
    	}

    	const mouseenter_handler_1 = point => selectPoint(point.Label, canvas2);
    	const mouseleave_handler_1 = point => deselectPoint(point.Label, canvas2);

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas2 = $$value;
    			$$invalidate(1, canvas2);
    		});
    	}

    	const mouseenter_handler_2 = point => selectPoint(point.Label, canvas3);
    	const mouseleave_handler_2 = point => deselectPoint(point.Label, canvas3);

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas3 = $$value;
    			$$invalidate(2, canvas3);
    		});
    	}

    	$$self.$capture_state = () => ({
    		data: data3,
    		data2: data3,
    		data3,
    		trace1,
    		trace2,
    		trace3,
    		layout,
    		canvas1,
    		canvas2,
    		canvas3,
    		selectedItem,
    		initializeViz,
    		vizHover,
    		vizUnhover,
    		selectPoint,
    		deselectPoint
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvas1" in $$props) $$invalidate(0, canvas1 = $$props.canvas1);
    		if ("canvas2" in $$props) $$invalidate(1, canvas2 = $$props.canvas2);
    		if ("canvas3" in $$props) $$invalidate(2, canvas3 = $$props.canvas3);
    		if ("selectedItem" in $$props) $$invalidate(3, selectedItem = $$props.selectedItem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvas1,
    		canvas2,
    		canvas3,
    		selectedItem,
    		initializeViz,
    		selectPoint,
    		deselectPoint,
    		mouseenter_handler,
    		mouseleave_handler,
    		div0_binding,
    		mouseenter_handler_1,
    		mouseleave_handler_1,
    		div2_binding,
    		mouseenter_handler_2,
    		mouseleave_handler_2,
    		div4_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
