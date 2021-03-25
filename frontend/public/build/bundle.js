
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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

    var data1 = [
    	{
    		Label: "stat0",
    		Legend: "Von̄ dem guͦt daz koͧft ward von den Mùlner von Zurich diz ist als von den selben guͦt untz an die suͣ ✳ dn der nach stat ✳ Hartmann Muller ✳ git iii malterͣ ker en swin sol gelten ✳ v ✳ f xxx ✳ eyier Item Johannes̄ Scherzer iiii malterͣ",
    		Coords: [
    			-0.7463741898536682,
    			1.6408809423446655,
    			-0.9489734768867493
    		]
    	},
    	{
    		Label: "stat1",
    		Legend: "ii fi Vo dez Mùliiz guͦt von Zurich von dem guͦt daz hie nach stat ✳ ze Sarmenstorf sol du eptissin Item ze Sarmenstorf",
    		Coords: [
    			-1.2432596683502197,
    			1.7434635162353516,
    			0.24499155580997467
    		]
    	},
    	{
    		Label: "stat2",
    		Legend: "✳ und daz dis war si und stet belibe ✳ so geben wir disen brief unserr herschaft versigelt mit der stat insigel von Bruke ✳ sid wir niht eigen insigel haben",
    		Coords: [
    			1.4730240106582642,
    			1.0938407182693481,
    			-0.019849445670843124
    		]
    	},
    	{
    		Label: "stat3",
    		Legend: "der vorgenanten lute bet ✳ haben unser stat insigel gehenket an disen brief ✳ ze einem offen urkunde ✳ der dingen die da vor geschriben stant",
    		Coords: [
    			2.6784493923187256,
    			-0.3330732583999634,
    			-0.26839956641197205
    		]
    	},
    	{
    		Label: "stat4",
    		Legend: "oͧch des vorgenanden guͦtes des gnanden convenz rechter were vûr eigen und vogteige als da vorgeschriben stat an allen dien stetten da si werscheft bedurfen von mir oder minen erben✳",
    		Coords: [
    			-1.0097774267196655,
    			-0.10090314596891403,
    			2.454177141189575
    		]
    	},
    	{
    		Label: "stat5",
    		Legend: "Chuͦnrad den schultheiss ✳ ✳ den rat und min buorger gemeinlich von Arowe daz si ir stat ingesigel ze einer gezûgsami dis koͧfes hant gehenckt an disen brief✳ Wir der Schultheiss",
    		Coords: [
    			2.013456344604492,
    			0.2884417176246643,
    			0.12911558151245117
    		]
    	},
    	{
    		Label: "stat6",
    		Legend: "der rat und dû gemeinde vorgenande wan dir koͧf vor uns beschach und mit urteilde gevertgot wart nach nach unser stat gewonheit und rechte mit allen dien gedin̄gen als davor geschriben",
    		Coords: [
    			1.0492157936096191,
    			-1.6573148965835571,
    			0.12820087373256683
    		]
    	},
    	{
    		Label: "stat7",
    		Legend: "stat dur bette des vorgenan Uͦlrich unsers burgers han wir gehencket unser stat ingesigel ze einer gezûgsami dis koͧfes und enkeinr werscheft anders sunderlich an disen",
    		Coords: [
    			-1.4408338069915771,
    			-0.7561373710632324,
    			-0.6320788264274597
    		]
    	},
    	{
    		Label: "stat8",
    		Legend: "stat dur bette des vorgenan Uͦlrich unsers burgers han wir gehencket unser stat ingesigel ze einer gezûgsami dis koͧfes und enkeinr werscheft anders sunderlich an disen",
    		Coords: [
    			-1.4408338069915771,
    			-0.7561373710632324,
    			-0.6320788264274597
    		]
    	},
    	{
    		Label: "stat9",
    		Legend: "stat hat gewert und ez in minen nutz han bekeret dez ich offenlich vergihe an disem briefe ✳ da von vergih oͧch ich ✳ daz ich",
    		Coords: [
    			-1.3330672979354858,
    			-1.163061261177063,
    			-0.45510628819465637
    		]
    	}
    ];

    var data2 = [
    	{
    		Label: "burg0",
    		Legend: "Schenko ✳ R✳ Vinsler ✳ R✳ Sauenwiler ✳ burger ✳ ze Brugge ✳ Dietrich von Lenzeburg burg ✳ und andˀ erbˀ lùte genuͦg✳ ✳ ✳ ✳ Königsfelden",
    		Coords: [
    			1.3866446018218994,
    			0.23537586629390717,
    			-0.07335907965898514
    		]
    	},
    	{
    		Label: "burg1",
    		Legend: "uf den guͤtern in dem Aygen ze Prukke ✳ uf dem Poͤz perg und anderswo als die brief sagent die der vorgnant unser oheim von Nellem - burg ✳ von",
    		Coords: [
    			0.5401713848114014,
    			0.4722857177257538,
    			0.20878253877162933
    		]
    	},
    	{
    		Label: "burg2",
    		Legend: "darzuͤ verzigen si sich geistliches und welthes gerichtes ✳ gewonheit der stete und des landes fries rechtes burg rechtes und gemeinlich ✳ aller der dinge da mite",
    		Coords: [
    			-1.4340101480484009,
    			1.8495968580245972,
    			0.46855592727661133
    		]
    	},
    	{
    		Label: "burg3",
    		Legend: "Allen den die disen brief ansehent oder hoͤrent lesen nu oder hie nach ✳ kûnden wir Johans Scherer schult heis ze der Nûwen Regensperg ✳ und die burger ✳ die ze der selben burg",
    		Coords: [
    			-0.3535294532775879,
    			0.16077731549739838,
    			-1.1568984985351562
    		]
    	},
    	{
    		Label: "burg4",
    		Legend: "den grûnden ✳ in aller der weise ✳ alz unser getruwe ✳ bruͤder Peter von Stoffeln ✳ cômentûr ze Tannenfels Hug von Guͤten burg ✳ Wernher Truchsêtz von Rinvelden und Heinrich von Rinach ✳ sundernt und usscheident ✳ und under marksteinent",
    		Coords: [
    			1.4372605085372925,
    			0.34989869594573975,
    			0.6543382406234741
    		]
    	},
    	{
    		Label: "burg5",
    		Legend: "✳ und von Uͦlrichen und Albrechten iren sunen✳ ein holtz genant ✳ die Eichals ✳ gelegen under unser burg Habsburg ✳ dasselb holtz und uns lehen ist ✳ daz wir zuͦ demselben kouffe ✳ unsern gunst und willen geben haben und",
    		Coords: [
    			-1.259008526802063,
    			0.005437659565359354,
    			-0.7085812091827393
    		]
    	},
    	{
    		Label: "burg6",
    		Legend: "Königsfelden 333 wist umb j hus zuͦ Lentzbùrg ✳ K H 8 Staatsarchiv AARGAU 366 ✳ diz ist der prieff von dez huss wegenze Lentz burg ✳",
    		Coords: [
    			1.2450711727142334,
    			0.044222552329301834,
    			-0.09669719636440277
    		]
    	},
    	{
    		Label: "burg7",
    		Legend: "den burg graben ze Habspurg den Ruͤdi Engelman buwet und gechdiet in daz burglehen ze Habspurg und der egenannten miner herrschaft von Oͤsterreich ledig ✳ worden ist von Heintzhn",
    		Coords: [
    			-1.0010827779769897,
    			-1.1347391605377197,
    			1.8226169347763062
    		]
    	},
    	{
    		Label: "burg8",
    		Legend: "den lebenden ✳ und geben ouch in dem namen als davor wissentlich mit disem briefe ✳ fùr frye ledig eigen ✳ den frânwalt ✳ und das holtz ✳ gelegen under der burg ze Brunegg ✳ in Ergoͤw ✳ das man von alter nennet den Hag",
    		Coords: [
    			-0.6308287382125854,
    			-0.8256052136421204,
    			-0.6310507655143738
    		]
    	},
    	{
    		Label: "burg9",
    		Legend: "und des ze urkùnd so henk ich der obgenanten lantvogt min eygen ingesigel an disen brief der geben ist ze Baden uff der burg an sant Margereten tag ✳ do man zalt von cristus gebùrt drùhundert ✳ eins und achtzig jar",
    		Coords: [
    			0.06931150704622269,
    			-1.1572494506835938,
    			-0.48770710825920105
    		]
    	}
    ];

    var data3 = [
    	{
    		Label: "schriben0",
    		Legend: "✳ daz dis allez daz hie vor ge- schriben ist ✳ stête belibe ✳ dar uber geben wir disen brief ✳ versigelt ✳ mit ûnserm insigel ✳ und mit dem insigel bruͦder Heinrich von Talhein der ze den ziten",
    		Coords: [
    			2.057774543762207,
    			0.20136170089244843,
    			0.5314192771911621
    		]
    	},
    	{
    		Label: "schriben1",
    		Legend: "vorge- schriben guͦter ✳ nùzze ✳ und ✳ rehte ze beiden dorfren ✳ gar ✳ und genzlich wider geben ze loͤsende ✳ umb ✳ drissig ✳ mark",
    		Coords: [
    			-0.38930603861808777,
    			2.2972381114959717,
    			-0.2487945407629013
    		]
    	},
    	{
    		Label: "schriben2",
    		Legend: "geistlicher froͧwen stat ze ire und ze ir nachkomen ✳ haͤnden dis nach ✳ ge- schriben gelt ✳ das lidig eigen ist und oͧch da fùr verkoͧft ist ✳ vier mùtt roggen ✳ ein malter habern ✳ ein halb swin sol oͧch ein",
    		Coords: [
    			0.8916307687759399,
    			0.03158307075500488,
    			0.14593303203582764
    		]
    	},
    	{
    		Label: "schriben3",
    		Legend: "wolt oder enmoͤht der sol und mach einen andern erbern knecht in die vorgenannte giselschaft schriben und legen der an siner stat ze glicher",
    		Coords: [
    			-0.6792559027671814,
    			-0.2869804799556732,
    			0.8405468463897705
    		]
    	},
    	{
    		Label: "schriben4",
    		Legend: "und sinen bruͦder schriben mir järzitbuͦch und inen ir jarzitt began jerlich und ewenklich disen obgeschribenen spruch habend beid teil jetwedrer fùr sich und die sinen gelobt und verheissen by trùw an",
    		Coords: [
    			-1.4592193365097046,
    			-0.5030133128166199,
    			1.7447373867034912
    		]
    	},
    	{
    		Label: "schriben5",
    		Legend: "ùch darumb schriben das ich hoften ir kemind àn verzichen denn wir ân ùch als unseren oberen zù den sachen nitt geantwurten koͤnden noch zetüend wisten ✳ meinten si nitt getùn koͤnden sunder",
    		Coords: [
    			-0.3245996832847595,
    			-0.5933279991149902,
    			-0.61163330078125
    		]
    	},
    	{
    		Label: "schriben6",
    		Legend: "schriben lassen das si und irn teil der gùlt von junckher Albrecht von Rinach verwist stent nach innhalt disz briefs etcꝭ und die vi mütt kernengelts ist dahar ✳ bisz uff",
    		Coords: [
    			-0.9310423135757446,
    			0.9522505402565002,
    			-0.697503924369812
    		]
    	},
    	{
    		Label: "schriben7",
    		Legend: "und hieruff zuͦ merer sicherheit aller vor und nachgeschriben dingen ✳ so von uns an disen brieff ver⁊ schriben stàn ✳ so haben wir ✳ den vilgnannten unsern",
    		Coords: [
    			1.3339762687683105,
    			-0.23611211776733398,
    			0.29407060146331787
    		]
    	},
    	{
    		Label: "schriben8",
    		Legend: "ze Brugg die mich mitt Hansen Zuͦloͧf iren dickgenannten ir zuͦ vogt geben hand soͤlich des Stapfers angeben und schrift vorgemeldether in schriben lassen und anstatt und fùr als vor stat gelopt ✳ soͤlich lichen und",
    		Coords: [
    			-0.10398373752832413,
    			-0.7050529718399048,
    			-0.8058676719665527
    		]
    	},
    	{
    		Label: "schriben9",
    		Legend: "✳und her in schriben und setzen laͤssen ✳ ✳ item des ersten ein gross acker ist der lùtpreistrye widen hat vor Hansz Geiszlier umb den landteil litt an dem kilchweg",
    		Coords: [
    			-0.3959745168685913,
    			-1.1579471826553345,
    			-1.1929081678390503
    		]
    	}
    ];

    /* src\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[15] = list;
    	child_ctx[16] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (91:4) {#each dataset as point (point.Label)}
    function create_each_block_1(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*point*/ ctx[17].Label + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*point*/ ctx[17].Legend + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[6](/*point*/ ctx[17], /*index*/ ctx[16], /*dataset*/ ctx[14]);
    	}

    	function mouseleave_handler() {
    		return /*mouseleave_handler*/ ctx[7](/*point*/ ctx[17], /*index*/ ctx[16], /*dataset*/ ctx[14]);
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
    			add_location(td0, file, 92, 6, 3641);
    			attr_dev(td1, "class", "svelte-11xc8po");
    			add_location(td1, file, 93, 6, 3671);
    			attr_dev(tr, "id", /*point*/ ctx[17].Label);
    			attr_dev(tr, "class", "svelte-11xc8po");
    			toggle_class(tr, "selected", /*point*/ ctx[17].Label === /*selectedItem*/ ctx[1]);
    			add_location(tr, file, 91, 5, 3420);
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

    			if (dirty & /*data, selectedItem*/ 6) {
    				toggle_class(tr, "selected", /*point*/ ctx[17].Label === /*selectedItem*/ ctx[1]);
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
    		source: "(91:4) {#each dataset as point (point.Label)}",
    		ctx
    	});

    	return block;
    }

    // (84:1) {#each data as dataset, index}
    function create_each_block(ctx) {
    	let div1;
    	let table;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t4;
    	let div0;
    	let index = /*index*/ ctx[16];
    	let t5;
    	let each_value_1 = /*dataset*/ ctx[14];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*point*/ ctx[17].Label;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const assign_div0 = () => /*div0_binding*/ ctx[8](div0, index);
    	const unassign_div0 = () => /*div0_binding*/ ctx[8](null, index);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Label";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Sentence";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div0 = element("div");
    			t5 = space();
    			add_location(th0, file, 87, 5, 3320);
    			add_location(th1, file, 88, 5, 3341);
    			add_location(tr, file, 86, 4, 3309);
    			add_location(table, file, 85, 3, 3296);
    			attr_dev(div0, "id", `viz${/*index*/ ctx[16]}`);
    			attr_dev(div0, "class", "viz");
    			add_location(div0, file, 97, 3, 3737);
    			attr_dev(div1, "class", "container svelte-11xc8po");
    			add_location(div1, file, 84, 2, 3268);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, table);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(table, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			assign_div0();
    			append_dev(div1, t5);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data, selectedItem, selectPoint, canvas, deselectPoint*/ 55) {
    				each_value_1 = /*dataset*/ ctx[14];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, table, destroy_block, create_each_block_1, null, get_each_context_1);
    			}

    			if (index !== /*index*/ ctx[16]) {
    				unassign_div0();
    				index = /*index*/ ctx[16];
    				assign_div0();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			unassign_div0();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(84:1) {#each data as dataset, index}",
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
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (script.src !== (script_src_value = "https://cdn.plot.ly/plotly-latest.min.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 77, 1, 1953);
    			attr_dev(h1, "class", "svelte-11xc8po");
    			add_location(h1, file, 81, 1, 2070);
    			add_location(p, file, 82, 1, 2109);
    			attr_dev(main, "class", "svelte-11xc8po");
    			add_location(main, file, 80, 0, 2061);
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(script, "load", /*initializeViz*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*canvas, data, selectedItem, selectPoint, deselectPoint*/ 55) {
    				each_value = /*data*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
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
    	let canvas = [];
    	let selectedItem = "";
    	const data = [data1, data2, data3]; // create data Object from JSONs

    	const traceOptions = {
    		//static Option for each trace
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
    		hovertemplate: "%{text}<extra></extra>",
    		showLegend: false
    	};

    	const createTrace = (points, name, options) => {
    		//create a trace from point-data
    		return {
    			x: points.map(o => o.Coords[0]),
    			y: points.map(o => o.Coords[1]),
    			z: points.map(o => o.Coords[2]),
    			text: [...points.map(o => o.Label)],
    			name,
    			...options
    		};
    	};

    	const traces = data.map((d, i) => createTrace(d, `Dataset ${i}`, traceOptions)); //create a trace for each dataset

    	const layout = {
    		hovermode: "closest",
    		margin: { l: 0, r: 0, b: 0, t: 0 }
    	};

    	const initializeViz = () => {
    		//initialization method
    		traces.forEach((trace, index) => {
    			Plotly.newPlot(canvas[index], [trace], layout, { showSendToCloud: true });
    			canvas[index].on("plotly_hover", vizHover);
    			canvas[index].on("plotly_unhover", () => $$invalidate(1, selectedItem = ""));
    		});
    	};

    	function vizHover(event) {
    		if (selectedItem !== event.points[0].text) {
    			$$invalidate(1, selectedItem = event.points[0].text);
    		}
    	}

    	const selectPoint = (point, canvasRef, dataRef) => {
    		let index = dataRef.map(o => o.Label).indexOf(point);
    		let colorArray = new Array(dataRef.length).fill("grey");
    		colorArray[index] = "red";
    		Plotly.restyle(canvasRef, "marker.color", [colorArray]);
    	};

    	const deselectPoint = (point, canvasRef, dataRef) => {
    		let colorArray = new Array(dataRef.length).fill("blue");
    		Plotly.restyle(canvasRef, "marker.color", [colorArray]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = (point, index, dataset) => selectPoint(point.Label, canvas[index], dataset);
    	const mouseleave_handler = (point, index, dataset) => deselectPoint(point.Label, canvas[index], dataset);

    	function div0_binding($$value, index) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas[index] = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		data1,
    		data2,
    		data3,
    		canvas,
    		selectedItem,
    		data,
    		traceOptions,
    		createTrace,
    		traces,
    		layout,
    		initializeViz,
    		vizHover,
    		selectPoint,
    		deselectPoint
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ("selectedItem" in $$props) $$invalidate(1, selectedItem = $$props.selectedItem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvas,
    		selectedItem,
    		data,
    		initializeViz,
    		selectPoint,
    		deselectPoint,
    		mouseenter_handler,
    		mouseleave_handler,
    		div0_binding
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
