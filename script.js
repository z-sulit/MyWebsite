/* ========== THREE.JS SCENE + INTERACTIONS ========== */
(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========== INTRO SCREEN UNLOCK ==========
    var introScreen = document.getElementById('introScreen');
    var isIntroLocked = true;

    function unlockIntro(e) {
        if (!isIntroLocked) return;
        isIntroLocked = false;
        
        introScreen.classList.add('leaving');
        document.body.classList.remove('no-scroll');
        
        setTimeout(() => {
            introScreen.classList.add('hidden');
        }, 1200); // Wait for CSS transition
        
        // Remove event listeners
        window.removeEventListener('click', unlockIntro);
    }

    if (introScreen) {
        window.addEventListener('click', unlockIntro, { once: true });
    }

    // ========== SCROLL TELEMETRY ==========
    var telemetryRoot = document.querySelector('.scroll-telemetry');
    var telemetryReadout = document.getElementById('telemetryReadout');
    var sectionHud = document.getElementById('sectionHud');
    var velocityHud = document.getElementById('velocityHud');
    var scrollState = {
        lastY: window.scrollY,
        lastT: performance.now(),
        velocity: 0,
        easedVelocity: 0
    };

    function getScrollProgress() {
        var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        return Math.min(1, Math.max(0, window.scrollY / maxScroll));
    }

    function updateScrollTelemetry() {
        var progress = getScrollProgress();
        document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
        document.documentElement.style.setProperty('--scroll-progress-percent', (progress * 100).toFixed(2) + '%');
        if (telemetryReadout) {
            telemetryReadout.textContent = String(Math.round(progress * 100)).padStart(2, '0') + '%';
        }
        if (telemetryRoot) {
            telemetryRoot.style.opacity = window.scrollY > 120 ? '1' : '';
        }
    }

    function updateScrollVelocity() {
        var now = performance.now();
        var dy = window.scrollY - scrollState.lastY;
        var dt = Math.max(16, now - scrollState.lastT);
        scrollState.velocity = Math.min(3, Math.abs(dy / dt));
        scrollState.easedVelocity += (scrollState.velocity - scrollState.easedVelocity) * 0.18;
        scrollState.lastY = window.scrollY;
        scrollState.lastT = now;
        document.documentElement.style.setProperty('--velocity-percent', Math.min(100, scrollState.easedVelocity * 85).toFixed(1) + '%');
        if (velocityHud) {
            velocityHud.textContent = scrollState.easedVelocity.toFixed(2);
        }
    }

    // ---- SCENE SETUP ----
    const canvas = document.getElementById('heroCanvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const isMobile = window.innerWidth < 768;
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ---- LIGHTING ----
    scene.add(new THREE.AmbientLight(0x2a1510, 0.4));
    const light1 = new THREE.PointLight(0xf4a34d, 1.5, 100);
    light1.position.set(15, 15, 10);
    scene.add(light1);
    const light2 = new THREE.PointLight(0xc96b8a, 1.2, 100);
    light2.position.set(-15, -10, 8);
    scene.add(light2);
    const light3 = new THREE.PointLight(0xf7c86f, 0.8, 80);
    light3.position.set(0, 0, -15);
    scene.add(light3);

    // ---- MATERIALS ----
    const amberMat = new THREE.MeshBasicMaterial({ color: 0xf4a34d, wireframe: true, transparent: true, opacity: 0.35 });
    const roseMat = new THREE.MeshBasicMaterial({ color: 0xc96b8a, wireframe: true, transparent: true, opacity: 0.25 });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xf7c86f, wireframe: true, transparent: true, opacity: 0.2 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf4a34d, transparent: true, opacity: 0.15 });

    // ---- 1. DATA POLYHEDRON (center) ----
    const polyGeo = new THREE.IcosahedronGeometry(4, 1);
    const polyWire = new THREE.Mesh(polyGeo, amberMat.clone());
    const polySolid = new THREE.Mesh(polyGeo, new THREE.MeshPhongMaterial({
        color: 0xf4a34d, transparent: true, opacity: 0.04, side: THREE.DoubleSide
    }));
    const polyGroup = new THREE.Group();
    polyGroup.add(polyWire, polySolid);
    masterGroup.add(polyGroup);

    // ---- 1B. ORBITAL DATA RINGS ----
    const ringGroup = new THREE.Group();
    const orbitRings = [];
    for (let r = 0; r < 4; r++) {
        const ringGeo = new THREE.TorusGeometry(5.8 + r * 1.45, 0.012 + r * 0.004, 8, 96);
        const ringMat = new THREE.MeshBasicMaterial({
            color: r % 2 === 0 ? 0xf4a34d : 0xc96b8a,
            wireframe: true,
            transparent: true,
            opacity: 0.1 - r * 0.012
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.set(r * 0.55, r * 0.38, r * 0.2);
        ring.userData = { speed: 0.0015 + r * 0.0009, phase: r * 1.3 };
        orbitRings.push(ring);
        ringGroup.add(ring);
    }
    masterGroup.add(ringGroup);

    // ---- 1C. SCROLL TUNNEL / TELEMETRY TRACK ----
    const tunnelGroup = new THREE.Group();
    const tunnelPositions = [];
    const tunnelDepth = isMobile ? 12 : 20;
    for (let i = 0; i < tunnelDepth; i++) {
        const z = -8 - i * 3.2;
        const scale = 1 + i * 0.08;
        const halfW = 11 * scale;
        const halfH = 6 * scale;
        tunnelPositions.push(
            -halfW, -halfH, z, halfW, -halfH, z,
            halfW, -halfH, z, halfW, halfH, z,
            halfW, halfH, z, -halfW, halfH, z,
            -halfW, halfH, z, -halfW, -halfH, z
        );
        if (i < tunnelDepth - 1) {
            const nextZ = -8 - (i + 1) * 3.2;
            const nextScale = 1 + (i + 1) * 0.08;
            const nextW = 11 * nextScale;
            const nextH = 6 * nextScale;
            tunnelPositions.push(
                -halfW, -halfH, z, -nextW, -nextH, nextZ,
                halfW, -halfH, z, nextW, -nextH, nextZ,
                halfW, halfH, z, nextW, nextH, nextZ,
                -halfW, halfH, z, -nextW, nextH, nextZ
            );
        }
    }
    const tunnelGeo = new THREE.BufferGeometry();
    tunnelGeo.setAttribute('position', new THREE.Float32BufferAttribute(tunnelPositions, 3));
    const tunnelMat = new THREE.LineBasicMaterial({ color: 0xf4a34d, transparent: true, opacity: 0.045 });
    const tunnelLines = new THREE.LineSegments(tunnelGeo, tunnelMat);
    tunnelGroup.add(tunnelLines);
    masterGroup.add(tunnelGroup);

    // ---- 1D. ANALYTICS MODULE BARS ----
    const analyticsGroup = new THREE.Group();
    const analyticsBars = [];
    const barGeo = new THREE.BoxGeometry(0.18, 1, 0.18);
    const barCount = isMobile ? 18 : 36;
    for (let i = 0; i < barCount; i++) {
        const barMat = new THREE.MeshBasicMaterial({
            color: i % 3 === 0 ? 0xf7c86f : (i % 3 === 1 ? 0xf4a34d : 0xc96b8a),
            transparent: true,
            opacity: 0.11
        });
        const bar = new THREE.Mesh(barGeo, barMat);
        const col = i % 12;
        const row = Math.floor(i / 12);
        bar.position.set(-8 + col * 1.45, -8.5 + row * 2.2, -12 - row * 2);
        bar.scale.y = 0.4 + Math.random() * 2.8;
        bar.userData = { base: bar.scale.y, phase: Math.random() * Math.PI * 2 };
        analyticsBars.push(bar);
        analyticsGroup.add(bar);
    }
    analyticsGroup.rotation.x = -0.18;
    masterGroup.add(analyticsGroup);

    // ---- 1E. PROJECT NETWORK CONSTELLATION ----
    const networkGroup = new THREE.Group();
    const networkPoints = [];
    const networkLinePositions = [];
    const networkNodeCount = isMobile ? 14 : 28;
    for (let i = 0; i < networkNodeCount; i++) {
        networkPoints.push(new THREE.Vector3(
            (Math.random() - 0.5) * 34,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 28
        ));
    }
    for (let i = 0; i < networkPoints.length; i++) {
        for (let j = i + 1; j < networkPoints.length; j++) {
            if (networkPoints[i].distanceTo(networkPoints[j]) < 11) {
                networkLinePositions.push(
                    networkPoints[i].x, networkPoints[i].y, networkPoints[i].z,
                    networkPoints[j].x, networkPoints[j].y, networkPoints[j].z
                );
            }
        }
    }
    const networkGeo = new THREE.BufferGeometry();
    networkGeo.setAttribute('position', new THREE.Float32BufferAttribute(networkLinePositions, 3));
    const networkMat = new THREE.LineBasicMaterial({ color: 0xc96b8a, transparent: true, opacity: 0.055 });
    const networkLines = new THREE.LineSegments(networkGeo, networkMat);
    networkGroup.add(networkLines);
    masterGroup.add(networkGroup);

    // ---- 2. GRAPH NODES + EDGES ----
    const nodeCount = isMobile ? 6 : 10;
    const nodePositions = [];
    const nodeMeshes = [];
    for (let i = 0; i < nodeCount; i++) {
        const geo = new THREE.IcosahedronGeometry(0.3, 0);
        const mat = i % 2 === 0 ? amberMat.clone() : roseMat.clone();
        mat.opacity = 0.5;
        const mesh = new THREE.Mesh(geo, mat);
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 15
        );
        mesh.position.copy(pos);
        nodePositions.push(pos);
        nodeMeshes.push(mesh);
        masterGroup.add(mesh);
    }

    // Connect nearby nodes with lines
    const edgeThreshold = 15;
    for (let i = 0; i < nodePositions.length; i++) {
        for (let j = i + 1; j < nodePositions.length; j++) {
            if (nodePositions[i].distanceTo(nodePositions[j]) < edgeThreshold) {
                const geo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
                masterGroup.add(new THREE.Line(geo, lineMat));
            }
        }
    }

    // ---- 3. SCATTER PLOT CLUSTERS ----
    const clusterCenters = [
        new THREE.Vector3(-10, 5, -5),
        new THREE.Vector3(12, -3, -8),
        new THREE.Vector3(5, 8, -12)
    ];
    const scatterCount = isMobile ? 80 : 200;
    const scatterPositions = new Float32Array(scatterCount * 3);
    const scatterColors = new Float32Array(scatterCount * 3);
    const colors = [
        new THREE.Color(0xf4a34d),
        new THREE.Color(0xc96b8a),
        new THREE.Color(0xf7c86f)
    ];
    for (let i = 0; i < scatterCount; i++) {
        const ci = i % 3;
        const center = clusterCenters[ci];
        scatterPositions[i * 3] = center.x + (Math.random() - 0.5) * 6;
        scatterPositions[i * 3 + 1] = center.y + (Math.random() - 0.5) * 6;
        scatterPositions[i * 3 + 2] = center.z + (Math.random() - 0.5) * 6;
        const c = colors[ci];
        scatterColors[i * 3] = c.r;
        scatterColors[i * 3 + 1] = c.g;
        scatterColors[i * 3 + 2] = c.b;
    }
    const scatterGeo = new THREE.BufferGeometry();
    scatterGeo.setAttribute('position', new THREE.BufferAttribute(scatterPositions, 3));
    scatterGeo.setAttribute('color', new THREE.BufferAttribute(scatterColors, 3));
    const scatterMat = new THREE.PointsMaterial({
        size: 0.15, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true
    });
    masterGroup.add(new THREE.Points(scatterGeo, scatterMat));

    // ---- 4. GRID PLANES ----
    if (!isMobile) {
        for (let g = 0; g < 2; g++) {
            const gridGeo = new THREE.PlaneGeometry(20, 20, 10, 10);
            const gridMat = new THREE.MeshBasicMaterial({
                color: g === 0 ? 0xf4a34d : 0xc96b8a,
                wireframe: true, transparent: true, opacity: 0.06
            });
            const grid = new THREE.Mesh(gridGeo, gridMat);
            grid.position.set(g === 0 ? -12 : 14, g === 0 ? -8 : 6, -15 + g * 5);
            grid.rotation.set(0.5 + g * 0.3, 0.3, g * 0.2);
            grid.userData = { rotSpeed: 0.0003 + g * 0.0002 };
            masterGroup.add(grid);
        }
    }

    // ---- 5. EMBER PARTICLES ----
    const emberCount = isMobile ? 120 : 400;
    const emberPositions = new Float32Array(emberCount * 3);
    const emberSpeeds = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) {
        emberPositions[i * 3] = (Math.random() - 0.5) * 50;
        emberPositions[i * 3 + 1] = (Math.random() - 0.5) * 40 - 10;
        emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        emberSpeeds[i] = 0.01 + Math.random() * 0.03;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
        color: 0xf4a34d, size: isMobile ? 0.08 : 0.1,
        transparent: true, opacity: 0.5, sizeAttenuation: true
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    masterGroup.add(embers);

    // ---- MOUSE PARALLAX ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!isMobile) {
        window.addEventListener('mousemove', function (e) {
            mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
            mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
        });
    }

    // ---- SCROLL PARALLAX ----
    var scrollParallax = { current: 0, target: 0 };
    window.addEventListener('scroll', function () {
        var scrollNorm = window.scrollY / window.innerHeight;
        // Reduce parallax strength since canvas is now fixed, 
        // keeping the 3D objects visible throughout the page
        scrollParallax.target = -scrollNorm * 3;
    });

    // ---- ANIMATION LOOP ----
    const clock = new THREE.Clock();
    function animate() {
        if (!prefersReducedMotion) {
            requestAnimationFrame(animate);
        }
        const t = clock.getElapsedTime();
        const progress = getScrollProgress();

        if (!prefersReducedMotion) {
            scrollState.easedVelocity += (0 - scrollState.easedVelocity) * 0.025;
            document.documentElement.style.setProperty('--velocity-percent', Math.min(100, scrollState.easedVelocity * 85).toFixed(1) + '%');
            if (velocityHud) {
                velocityHud.textContent = scrollState.easedVelocity.toFixed(2);
            }

            const velocityBoost = 1 + scrollState.easedVelocity * 1.8;
            const projectMood = Math.max(0, 1 - Math.abs(progress - 0.38) / 0.22);
            const skillsMood = Math.max(0, 1 - Math.abs(progress - 0.58) / 0.18);
            const resumeMood = Math.max(0, 1 - Math.abs(progress - 0.74) / 0.2);

            // Rotate data polyhedron with scroll-reactive depth
            polyGroup.rotation.x = t * 0.08 + progress * 0.55;
            polyGroup.rotation.y = t * 0.12 + progress * 0.8;
            polyGroup.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.18);

            // Pulse polyhedron opacity
            polyWire.material.opacity = 0.26 + Math.sin(t * 0.8) * 0.1 + progress * 0.08;

            // Orbital rings intensify in hero/about and drift as the scroll story progresses
            ringGroup.rotation.x = t * 0.035 + progress * 0.4;
            ringGroup.rotation.y = t * 0.05 + progress * 0.9;
            ringGroup.position.z = -progress * 8;
            orbitRings.forEach(function (ring, i) {
                ring.rotation.z += ring.userData.speed * (1 + progress * 2) * velocityBoost;
                ring.material.opacity = 0.055 + Math.sin(t + ring.userData.phase) * 0.018 + Math.max(0, 0.16 - progress * 0.12);
            });

            // Scroll tunnel becomes most visible around resume/timeline, like moving through a data corridor
            tunnelGroup.rotation.z = Math.sin(t * 0.12) * 0.025 + progress * 0.08;
            tunnelGroup.position.z = (progress * 26 + scrollState.easedVelocity * 6) % 3.2;
            tunnelMat.opacity = 0.035 + resumeMood * 0.1 + progress * 0.025;

            // Analytics bars pulse around the skills section
            analyticsGroup.position.y = -progress * 2.5;
            analyticsGroup.rotation.y = -0.18 + progress * 0.35;
            analyticsBars.forEach(function (bar, i) {
                bar.scale.y = Math.max(0.2, bar.userData.base + Math.sin(t * 1.4 + bar.userData.phase + progress * 8) * (0.25 + skillsMood * 0.55));
                bar.material.opacity = 0.07 + skillsMood * 0.18;
            });

            // Project network appears denser through the work section
            networkGroup.rotation.y = t * 0.018 + progress * 0.42;
            networkGroup.rotation.x = Math.sin(t * 0.22) * 0.04;
            networkMat.opacity = 0.04 + projectMood * 0.18;

            // Bob graph nodes
            nodeMeshes.forEach(function (m, i) {
                m.position.y += Math.sin(t * 0.5 + i) * 0.003;
                m.rotation.x = t * 0.3 + i;
                m.scale.setScalar(1 + Math.sin(t + i + progress * 4) * 0.08);
            });

            // Drift embers upward
            var pos = emberGeo.attributes.position.array;
            for (var i = 0; i < emberCount; i++) {
                pos[i * 3 + 1] += emberSpeeds[i] * (1 + progress * 0.7) * velocityBoost;
                pos[i * 3] += Math.sin(t + i) * 0.003;
                if (pos[i * 3 + 1] > 25) {
                    pos[i * 3 + 1] = -20;
                    pos[i * 3] = (Math.random() - 0.5) * 50;
                    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
                }
            }
            emberGeo.attributes.position.needsUpdate = true;

            // Rotate grids
            masterGroup.children.forEach(function (c) {
                if (c.userData && c.userData.rotSpeed) {
                    c.rotation.z += c.userData.rotSpeed * (1 + progress);
                }
            });

            // Mouse parallax (lerp)
            mouse.x += (mouse.tx - mouse.x) * 0.05;
            mouse.y += (mouse.ty - mouse.y) * 0.05;
            masterGroup.rotation.y = mouse.x * 0.15 + progress * 0.12;
            masterGroup.rotation.x = mouse.y * 0.1 - progress * 0.08;

            // Scroll parallax (lerp)
            scrollParallax.current += (scrollParallax.target - scrollParallax.current) * 0.05;
            masterGroup.position.y = scrollParallax.current;
            masterGroup.position.z = -progress * 4;

            // Subtle light movement
            light1.position.x = 15 + Math.sin(t * 0.3) * 3;
            light2.position.y = -10 + Math.cos(t * 0.4) * 3;
        }

        renderer.render(scene, camera);
    }
    animate();

    // ---- RESIZE ----
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ========== CUSTOM CURSOR ==========
    var cursorDot = document.getElementById('cursorDot');
    var cursorRing = document.getElementById('cursorRing');
    var cx = 0, cy = 0, dx = 0, dy = 0;

    if (!isMobile && cursorDot && cursorRing) {
        window.addEventListener('mousemove', function (e) {
            dx = e.clientX;
            dy = e.clientY;
        });
        (function cursorLoop() {
            cx += (dx - cx) * 0.15;
            cy += (dy - cy) * 0.15;
            cursorDot.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) translate(-50%, -50%)';
            cursorRing.style.transform = 'translate(' + cx + 'px, ' + cy + 'px) translate(-50%, -50%)';
            requestAnimationFrame(cursorLoop);
        })();

        // Hover grow effect
        document.querySelectorAll('a, button, .project-card, .skill-pill').forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                cursorRing.style.width = '55px';
                cursorRing.style.height = '55px';
                cursorRing.style.borderColor = 'rgba(244,163,77,0.8)';
                cursorDot.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) translate(-50%, -50%) scale(1.5)';
            });
            el.addEventListener('mouseleave', function () {
                cursorRing.style.width = '36px';
                cursorRing.style.height = '36px';
                cursorRing.style.borderColor = 'rgba(244,163,77,0.5)';
            });
        });
    }

    // ========== SCROLL REVEAL ==========
    function scrambleText(el) {
        if (!el || el.dataset.scrambled === 'true' || prefersReducedMotion) return;
        el.dataset.scrambled = 'true';
        var finalText = el.textContent;
        var chars = '01<>/{}[]#$%&DATA';
        var frame = 0;
        var maxFrames = 22;
        function tick() {
            var progress = frame / maxFrames;
            var output = finalText.split('').map(function (char, i) {
                if (char === ' ') return ' ';
                if (i / finalText.length < progress) return finalText[i];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            el.textContent = output;
            frame++;
            if (frame <= maxFrames) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = finalText;
            }
        }
        tick();
    }

    var reveals = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                var heading = entry.target.matches('.section-header') ? entry.target.querySelector('h2') : null;
                if (heading) scrambleText(heading);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(function (el) { observer.observe(el); });

    // ========== TIMELINE ITEMS REVEAL ==========
    var timelineItems = document.querySelectorAll('.timeline-item');
    var timelineObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3, rootMargin: '0px 0px -30px 0px' });
    timelineItems.forEach(function (el) { timelineObserver.observe(el); });

    // ========== SELF-DRAWING TIMELINE ==========
    var timeline = document.querySelector('.timeline');
    function updateTimelineProgress() {
        if (!timeline) return;
        var rect = timeline.getBoundingClientRect();
        var windowH = window.innerHeight;
        // Start drawing when top enters bottom of viewport, finish when bottom reaches center
        var start = rect.top - windowH;
        var end = rect.bottom - windowH * 0.5;
        var progress = 0;
        if (start < 0) {
            progress = Math.min(1, Math.max(0, -start / (end - start)));
        }
        timeline.style.setProperty('--timeline-progress', progress);
    }

    // ========== SCROLL DEPTH + ACTIVE STORYTELLING ==========
    function updateSectionDepth() {
        if (isMobile || prefersReducedMotion) return;
        document.querySelectorAll('.section').forEach(function (section) {
            var rect = section.getBoundingClientRect();
            var viewportCenter = window.innerHeight / 2;
            var sectionCenter = rect.top + rect.height / 2;
            var distance = (sectionCenter - viewportCenter) / window.innerHeight;
            var depth = Math.max(-18, Math.min(18, distance * -18));
            section.style.setProperty('--section-depth', depth.toFixed(2) + 'px');
        });
    }

    function updateActiveTimelineItem() {
        if (!timelineItems.length) return;
        var bestItem = null;
        var bestDistance = Infinity;
        timelineItems.forEach(function (item) {
            var rect = item.getBoundingClientRect();
            var distance = Math.abs((rect.top + rect.height / 2) - window.innerHeight * 0.48);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestItem = item;
            }
        });
        timelineItems.forEach(function (item) {
            item.classList.toggle('active', item === bestItem && bestDistance < window.innerHeight * 0.35);
        });
    }

    function updateProjectScrollStage() {
        if (isMobile || prefersReducedMotion) return;
        projectCards.forEach(function (card) {
            if (card.dataset.hovering === 'true') return;
            var rect = card.getBoundingClientRect();
            var center = rect.top + rect.height / 2;
            var distance = Math.abs(center - window.innerHeight * 0.52) / window.innerHeight;
            var focus = Math.max(0, 1 - distance * 2.2);
            var lift = -focus * 18;
            var scale = 1 + focus * 0.018;
            var rotate = (center - window.innerHeight * 0.52) / window.innerHeight * -3;
            card.classList.toggle('scroll-focused', focus > 0.5);
            card.style.setProperty('--card-scroll-glow', focus.toFixed(3));
            card.style.transform = 'translate3d(0,' + lift.toFixed(2) + 'px,' + (focus * 20).toFixed(2) + 'px) rotateX(' + rotate.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
        });
    }

    // ========== ANIMATED STAT COUNTERS ==========
    var statNumbers = document.querySelectorAll('.stat-number');
    var statsCounted = false;
    var statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && !statsCounted) {
                statsCounted = true;
                statNumbers.forEach(function (el) {
                    var text = el.textContent.trim();
                    var target = parseInt(text);
                    var suffix = text.replace(/[0-9]/g, '');
                    var startTime = null;
                    var duration = 1500;
                    el.textContent = '0' + suffix;
                    function countUp(timestamp) {
                        if (!startTime) startTime = timestamp;
                        var elapsed = timestamp - startTime;
                        var progress = Math.min(elapsed / duration, 1);
                        // Ease out cubic
                        var eased = 1 - Math.pow(1 - progress, 3);
                        var current = Math.round(eased * target);
                        el.textContent = current + suffix;
                        if (progress < 1) {
                            requestAnimationFrame(countUp);
                        }
                    }
                    requestAnimationFrame(countUp);
                });
            }
        });
    }, { threshold: 0.5 });
    if (statNumbers.length > 0) {
        statsObserver.observe(statNumbers[0].closest('.about-stats'));
    }

    // ========== DRS NAVBAR INDICATOR ==========
    var navbar = document.getElementById('navbar');
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');
    var navIndicator = document.getElementById('navIndicator');
    var scrollIndicator = document.getElementById('scrollIndicator');
    var sections = document.querySelectorAll('section[id]');
    var navAnchors = navLinks ? navLinks.querySelectorAll('a[href^="#"]') : [];

    function updateNavIndicator(activeId) {
        if (!navIndicator || !navLinks || isMobile) return;
        var activeLink = null;
        navAnchors.forEach(function (a) {
            if (a.getAttribute('href') === '#' + activeId) {
                activeLink = a;
            }
        });
        if (activeLink) {
            var linkRect = activeLink.getBoundingClientRect();
            var parentRect = navLinks.getBoundingClientRect();
            navLinks.style.setProperty('--indicator-left', (linkRect.left - parentRect.left) + 'px');
            navLinks.style.setProperty('--indicator-width', linkRect.width + 'px');
            navLinks.style.setProperty('--indicator-opacity', '1');
        }
    }

    var activeSection = '';

    function setActiveSection(id) {
        if (!id || id === activeSection) return;
        activeSection = id;
        if (sectionHud) {
            sectionHud.textContent = id.toUpperCase();
        }
        if (id !== 'hero') {
            updateNavIndicator(id);
        } else if (navLinks) {
            navLinks.style.setProperty('--indicator-opacity', '0');
        }
    }

    function updateActiveSectionByScroll() {
        var probeY = window.innerHeight * 0.38;
        var bestId = 'hero';
        var bestDistance = Infinity;

        sections.forEach(function (section) {
            var rect = section.getBoundingClientRect();
            var id = section.getAttribute('id');
            var containsProbe = rect.top <= probeY && rect.bottom >= probeY;
            var sectionCenter = rect.top + rect.height / 2;
            var distance = Math.abs(sectionCenter - probeY);

            if (containsProbe) {
                bestId = id;
                bestDistance = -1;
            } else if (bestDistance !== -1 && distance < bestDistance) {
                bestId = id;
                bestDistance = distance;
            }
        });

        setActiveSection(bestId);
    }

    // ========== 3D TILT ON PROJECT CARDS ==========
    var projectCards = document.querySelectorAll('.project-card');
    if (!isMobile && !prefersReducedMotion) {
        projectCards.forEach(function (card) {
            var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
            var hovering = false;
            function tiltLoop() {
                currentX += (targetX - currentX) * 0.14;
                currentY += (targetY - currentY) * 0.14;
                if (hovering) {
                    card.style.transform = 'rotateX(' + currentX.toFixed(2) + 'deg) rotateY(' + currentY.toFixed(2) + 'deg) translateZ(16px) scale(1.015)';
                    requestAnimationFrame(tiltLoop);
                }
            }
            card.addEventListener('mouseenter', function () {
                hovering = true;
                card.dataset.hovering = 'true';
                requestAnimationFrame(tiltLoop);
            });
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var centerX = rect.width / 2;
                var centerY = rect.height / 2;
                targetY = ((x - centerX) / centerX) * 9;
                targetX = ((centerY - y) / centerY) * 9;
                card.style.setProperty('--mouse-x', ((x / rect.width) * 100) + '%');
                card.style.setProperty('--mouse-y', ((y / rect.height) * 100) + '%');
            });
            card.addEventListener('mouseleave', function () {
                hovering = false;
                card.dataset.hovering = 'false';
                targetX = 0;
                targetY = 0;
                card.style.transform = '';
                card.style.setProperty('--mouse-x', '50%');
                card.style.setProperty('--mouse-y', '50%');
                updateProjectScrollStage();
            });
        });
    }

    // ========== MAGNETIC MICRO-INTERACTIONS ==========
    if (!isMobile && !prefersReducedMotion) {
        document.querySelectorAll('.cta-button, .social-link').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var rect = el.getBoundingClientRect();
                var x = (e.clientX - rect.left - rect.width / 2) / rect.width;
                var y = (e.clientY - rect.top - rect.height / 2) / rect.height;
                el.style.setProperty('--magnet-x', (x * 10).toFixed(2) + 'px');
                el.style.setProperty('--magnet-y', (y * 8).toFixed(2) + 'px');
            });
            el.addEventListener('mouseleave', function () {
                el.style.setProperty('--magnet-x', '0px');
                el.style.setProperty('--magnet-y', '0px');
            });
        });
    }

    // ========== SCROLL EFFECTS ==========
    window.addEventListener('scroll', function () {
        updateScrollVelocity();
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        // Hide scroll indicator
        if (scrollIndicator && window.scrollY > 200) {
            scrollIndicator.style.opacity = '0';
        }
        // Update scroll-linked systems
        updateScrollTelemetry();
        updateTimelineProgress();
        updateSectionDepth();
        updateActiveTimelineItem();
        updateProjectScrollStage();
        updateActiveSectionByScroll();
    }, { passive: true });
    // Initial call
    updateScrollTelemetry();
    updateTimelineProgress();
    updateSectionDepth();
    updateActiveTimelineItem();
    updateProjectScrollStage();
    updateActiveSectionByScroll();

    // Hamburger menu
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ========== CONTACT FORM ==========
    var form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = document.getElementById('submitBtn');
            var originalHtml = '<span>Send Message</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
            
            btn.innerHTML = '<span>Sending...</span>';
            
            var data = new FormData(form);
            fetch(form.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    btn.innerHTML = '<span>Message Sent! ✓</span>';
                    btn.style.background = 'linear-gradient(135deg, #c96b8a, #f4a34d)';
                    form.reset();
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            btn.innerHTML = '<span>Error Sending</span>';
                        } else {
                            btn.innerHTML = '<span>Oops! Problem.</span>';
                        }
                    });
                }
            }).catch(error => {
                btn.innerHTML = '<span>Oops! Problem.</span>';
            }).finally(() => {
                setTimeout(function () {
                    btn.innerHTML = originalHtml;
                    btn.style.background = '';
                }, 3000);
            });
        });
    }
})();
