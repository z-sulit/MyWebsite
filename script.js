/* ========== THREE.JS SCENE + INTERACTIONS ========== */
(function () {
    'use strict';

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
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Rotate data polyhedron
        polyGroup.rotation.x = t * 0.08;
        polyGroup.rotation.y = t * 0.12;

        // Pulse polyhedron opacity
        polyWire.material.opacity = 0.3 + Math.sin(t * 0.8) * 0.1;

        // Bob graph nodes
        nodeMeshes.forEach(function (m, i) {
            m.position.y += Math.sin(t * 0.5 + i) * 0.003;
            m.rotation.x = t * 0.3 + i;
        });

        // Drift embers upward
        var pos = emberGeo.attributes.position.array;
        for (var i = 0; i < emberCount; i++) {
            pos[i * 3 + 1] += emberSpeeds[i];
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
                c.rotation.z += c.userData.rotSpeed;
            }
        });

        // Mouse parallax (lerp)
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        masterGroup.rotation.y = mouse.x * 0.15;
        masterGroup.rotation.x = mouse.y * 0.1;

        // Scroll parallax (lerp)
        scrollParallax.current += (scrollParallax.target - scrollParallax.current) * 0.05;
        masterGroup.position.y = scrollParallax.current;

        // Subtle light movement
        light1.position.x = 15 + Math.sin(t * 0.3) * 3;
        light2.position.y = -10 + Math.cos(t * 0.4) * 3;

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
    var reveals = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
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
    var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var id = entry.target.getAttribute('id');
                if (id !== 'hero') {
                    activeSection = id;
                    updateNavIndicator(id);
                } else {
                    // Hide indicator when hero is in view
                    if (navLinks) navLinks.style.setProperty('--indicator-opacity', '0');
                }
            }
        });
    }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });

    // ========== 3D TILT ON PROJECT CARDS ==========
    var projectCards = document.querySelectorAll('.project-card');
    if (!isMobile) {
        projectCards.forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var centerX = rect.width / 2;
                var centerY = rect.height / 2;
                var rotateY = ((x - centerX) / centerX) * 8;
                var rotateX = ((centerY - y) / centerY) * 8;
                card.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(10px)';
                // Update spotlight position
                var percentX = (x / rect.width) * 100;
                var percentY = (y / rect.height) * 100;
                card.style.setProperty('--mouse-x', percentX + '%');
                card.style.setProperty('--mouse-y', percentY + '%');
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
                card.style.setProperty('--mouse-x', '50%');
                card.style.setProperty('--mouse-y', '50%');
            });
        });
    }

    // ========== SCROLL EFFECTS ==========
    window.addEventListener('scroll', function () {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        // Hide scroll indicator
        if (scrollIndicator && window.scrollY > 200) {
            scrollIndicator.style.opacity = '0';
        }
        // Update timeline drawing
        updateTimelineProgress();
    });
    // Initial call
    updateTimelineProgress();

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
