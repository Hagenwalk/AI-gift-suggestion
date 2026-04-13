/* ==========================================
   GIFTRAvault - Main Application JS
   AI-Powered Gift Recommendation Engine
   ========================================== */

"use strict";

/* ── GLOBAL STATE ─────────────────────── */
const APP = {
  currentUser: null,
  giftDetails: {},
  products: [],
  wishlist: new Set(),
  activeOccasion: null,
  filterCategory: 'all',
};

/* ── HELPERS ─────────────────────────── */
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }
function qs(sel) { return document.querySelector(sel); }

function showToast(msg, icon = '✦', duration = 3500) {
  const existing = qs('.toast');
  if (existing) existing.remove();

  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  document.body.appendChild(t);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => t.classList.add('show'));
  });

  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, duration);
}

function setPage(html) {
  window.location.href = html;
}

function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/* ── PARTICLES ────────────────────────── */
function initParticles() {
  const container = qs('.particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.setProperty('--dur', (6 + Math.random() * 10) + 's');
    p.style.setProperty('--delay', (Math.random() * 12) + 's');
    p.style.left = (Math.random() * 100) + '%';
    p.style.width = p.style.height = (1 + Math.random() * 2.5) + 'px';
    container.appendChild(p);
  }
}

/* ── NAVBAR ───────────────────────────── */
function initNavbar() {
  const nav = qs('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Highlight active page
  const path = window.location.pathname.split('/').pop();
  $$('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // User avatar
  const user = getStoredUser();
  if (user) {
    const loginBtns = $$('.btn-nav-login');
    loginBtns.forEach(btn => {
      btn.textContent = user.name.split(' ')[0];
    });
  }
}

/* ── LOCAL STORAGE HELPERS ─────────────── */
function storeUser(user) {
  localStorage.setItem('giftra_user', JSON.stringify(user));
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('giftra_user')); }
  catch { return null; }
}

function storeGiftDetails(details) {
  localStorage.setItem('giftra_gift_details', JSON.stringify(details));
}

function getGiftDetails() {
  try { return JSON.parse(localStorage.getItem('giftra_gift_details')) || {}; }
  catch { return {}; }
}

/* ══════════════════════════════════════════
   LOGIN PAGE
   ══════════════════════════════════════════ */
function initLoginPage() {
  if (!$('loginForm')) return;

  // Tab switching (Login / Register)
  $$('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $$('[data-panel]').forEach(p => {
        p.style.display = p.dataset.panel === tab ? 'block' : 'none';
      });
    });
  });

  // Toggle password visibility
  $$('.toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text'; btn.textContent = '🙈';
      } else {
        input.type = 'password'; btn.textContent = '👁';
      }
    });
  });

  // Login form
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('loginEmail').value.trim();
    const pass  = $('loginPassword').value.trim();

    if (!email || !pass) {
      showToast('Please fill all fields', '⚠️'); return;
    }

    const btn = $('loginBtn');
    btn.textContent = 'Signing in…'; btn.disabled = true;

    await new Promise(r => setTimeout(r, 900)); // simulate

    const user = {
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}&backgroundColor=C9A84C&textColor=0B1426`,
    };
    storeUser(user);
    showToast(`Welcome back, ${user.name}! ✨`, '👋');

    setTimeout(() => setPage('home.html'), 1000);
  });

  // Register form
  if ($('registerForm')) {
    $('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name  = $('regName').value.trim();
      const email = $('regEmail').value.trim();
      const pass  = $('regPassword').value.trim();

      if (!name || !email || !pass) {
        showToast('Please fill all fields', '⚠️'); return;
      }

      const btn = $('registerBtn');
      btn.textContent = 'Creating Account…'; btn.disabled = true;

      await new Promise(r => setTimeout(r, 1000));

      const user = { email, name, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=C9A84C&textColor=0B1426` };
      storeUser(user);
      showToast(`Account created! Welcome, ${name}! 🎉`, '✨');
      setTimeout(() => setPage('home.html'), 1000);
    });
  }

  // Guest access
  const guestBtn = $('guestBtn');
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      storeUser({ email: 'guest@giftra.in', name: 'Guest', avatar: '' });
      setPage('home.html');
    });
  }
}

/* ══════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════ */
function initHomePage() {
  if (!$('occasionsGrid')) return;

  const occasions = [
    { id: 'birthday',      icon: '🎂', name: 'Birthday',        desc: 'Celebrate another year',     color: 'rgba(201,168,76,0.08)' },
    { id: 'anniversary',   icon: '💑', name: 'Anniversary',     desc: 'Cherish lasting love',       color: 'rgba(107,26,58,0.1)' },
    { id: 'baby_shower',   icon: '👶', name: 'Baby Shower',     desc: 'Welcome a new life',         color: 'rgba(74,107,65,0.1)' },
    { id: 'proposal',      icon: '💍', name: 'Proposal',        desc: 'Pop the big question',       color: 'rgba(74,45,138,0.12)' },
    { id: 'breakup',       icon: '💙', name: 'Break Up',        desc: 'Healing & new beginnings',   color: 'rgba(37,99,235,0.1)' },
    { id: 'surprise_visit',icon: '🤗', name: 'Surprise Visit',  desc: 'Show up unannounced',        color: 'rgba(201,168,76,0.06)' },
  ];

  const grid = $('occasionsGrid');
  grid.innerHTML = occasions.map(o => `
    <div class="occasion-card slide-in-up" data-occasion="${o.id}" style="--card-color:${o.color}">
      <span class="occasion-icon">${o.icon}</span>
      <div class="occasion-name">${o.name}</div>
      <div class="occasion-desc">${o.desc}</div>
    </div>
  `).join('');

  $$('.occasion-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.occasion-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      APP.activeOccasion = card.dataset.occasion;
      localStorage.setItem('giftra_occasion', APP.activeOccasion);
      showToast(`Occasion set: ${card.querySelector('.occasion-name').textContent}`, '🎁');
      setTimeout(() => setPage('details.html'), 800);
    });
  });

  // Counter animation
  $$('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target || el.textContent);
    let count = 0;
    const inc = target / 60;
    const timer = setInterval(() => {
      count = Math.min(count + inc, target);
      el.textContent = (count >= target ? target : Math.floor(count)) + (el.dataset.suffix || '+');
      if (count >= target) clearInterval(timer);
    }, 25);
  });

  // Animated hero viz orbit items
  const orbitItems = [
    { emoji: '🎂', style: 'top:10%; left:50%; transform:translate(-50%,-50%)' },
    { emoji: '💍', style: 'top:50%; right:-2%; transform:translate(0,-50%)' },
    { emoji: '🌸', style: 'bottom:10%; left:50%; transform:translate(-50%,50%)' },
    { emoji: '🎁', style: 'top:50%; left:-2%; transform:translate(0,-50%)' },
  ];

  const vizContainer = qs('.hero-gift-viz');
  if (vizContainer) {
    orbitItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'orbit-item';
      el.style.cssText = item.style;
      el.textContent = item.emoji;
      vizContainer.appendChild(el);
    });
  }

  // Get Started button
  const startBtn = $('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => setPage('details.html'));
  }
}

/* ══════════════════════════════════════════
   CUSTOMER DETAILS PAGE
   ══════════════════════════════════════════ */
function initDetailsPage() {
  if (!$('detailsForm')) return;

  // Pre-select occasion if stored
  const storedOccasion = localStorage.getItem('giftra_occasion');
  if (storedOccasion) {
    const sel = $('occasionSelect');
    if (sel) sel.value = storedOccasion;
  }

  // Interests tags
  const interests = [
    '📚 Books', '🎵 Music', '🎮 Gaming', '🍕 Foodie', '✈️ Travel',
    '💄 Beauty', '👗 Fashion', '🌿 Nature', '🏋️ Fitness', '🎨 Art',
    '📸 Photography', '🧘 Wellness', '💻 Tech', '🐾 Pets', '🌍 Culture',
    '🍷 Wine', '☕ Coffee', '🎭 Theatre', '🚴 Cycling', '🧁 Baking',
  ];

  const interestsGrid = $('interestsGrid');
  if (interestsGrid) {
    interestsGrid.innerHTML = interests.map(i => `
      <div class="interest-tag">${i}</div>
    `).join('');

    interestsGrid.querySelectorAll('.interest-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        tag.classList.toggle('selected');
      });
    });
  }

  // Budget slider
  const budgetSlider = $('budgetSlider');
  const budgetDisplay = $('budgetDisplay');
  if (budgetSlider && budgetDisplay) {
    budgetSlider.addEventListener('input', () => {
      budgetDisplay.textContent = formatCurrency(budgetSlider.value);
    });
  }

  // Form submission
  $('detailsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedInterests = [...$$('.interest-tag.selected')].map(t => t.textContent.replace(/^[^\w]*/, '').trim());

    const details = {
      recipientName: $('recipientName')?.value || '',
      age: $('recipientAge')?.value || '',
      gender: $('recipientGender')?.value || '',
      occasion: $('occasionSelect')?.value || storedOccasion || '',
      relationship: $('relationship')?.value || '',
      personality: $('personality')?.value || '',
      interests: selectedInterests,
      budget: $('budgetSlider')?.value || 2000,
      note: $('additionalNote')?.value || '',
    };

    if (!details.occasion) {
      showToast('Please select an occasion', '⚠️'); return;
    }

    storeGiftDetails(details);
    showToast('Analyzing preferences with AI…', '✨');

    // Show AI processing overlay
    const overlay = $('aiProcessingOverlay');
    if (overlay) {
      overlay.classList.add('open');
      await runAIProcessingAnimation(overlay);
    } else {
      await new Promise(r => setTimeout(r, 500));
    }

    setPage('products.html');
  });
}

async function runAIProcessingAnimation(overlay) {
  const steps = overlay.querySelectorAll('.ai-step');
  for (let i = 0; i < steps.length; i++) {
    if (i > 0) steps[i - 1].classList.remove('active');
    if (i > 0) steps[i - 1].classList.add('done');
    steps[i - 1]?.querySelector('.step-dot');
    steps[i].classList.add('active');
    await new Promise(r => setTimeout(r, 600));
  }
  if (steps.length) {
    steps[steps.length - 1].classList.remove('active');
    steps[steps.length - 1].classList.add('done');
  }
  await new Promise(r => setTimeout(r, 400));
}

/* ══════════════════════════════════════════
   PRODUCTS PAGE – AI ENGINE
   ══════════════════════════════════════════ */

/* Product database (seed data with real product categories & links) */
const PRODUCT_DATABASE = {
  birthday: [
    {
      id: 'b1', name: 'Luxury Perfume Gift Set',
      category: 'Fragrance', price: 2499, original: 3499,
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=80',
      desc: 'An exquisite collection of premium eau de parfum in a beautifully crafted gift box. Perfect for celebrating someone special.',
      features: ['Curated designer fragrances', 'Elegant gift packaging', '100ml each, 3 bottles', 'Long-lasting 8+ hours', 'Suitable for all skin types'],
      rating: 4.7, reviews: 1240,
      platforms: [
        { name: 'Amazon', price: 2499, url: 'https://www.amazon.in/s?k=luxury+perfume+gift+set', best: true },
        { name: 'Nykaa', price: 2799, url: 'https://www.nykaa.com/perfumes', best: false },
        { name: 'Myntra', price: 2999, url: 'https://www.myntra.com/perfumes', best: false },
      ],
      tags: ['female', 'male', 'luxury'],
    },
    {
      id: 'b2', name: 'Personalised Star Map Print',
      category: 'Memories', price: 899, original: 1499,
      image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&q=80',
      desc: 'Custom star map showing the night sky from any location and date — capture the exact moment that changed their life.',
      features: ['Custom date & location', 'Premium matte print', 'A3 / A2 framed options', 'Digital delivery in 24hrs', 'Museum-quality paper'],
      rating: 4.9, reviews: 876,
      platforms: [
        { name: 'Etsy India', price: 899, url: 'https://www.etsy.com/in-en/search?q=personalised+star+map', best: true },
        { name: 'Zazzle', price: 1199, url: 'https://www.zazzle.com/star+map', best: false },
        { name: 'Instacart', price: 1350, url: 'https://www.instacart.com', best: false },
      ],
      tags: ['female', 'male', 'sentimental'],
    },
    {
      id: 'b3', name: 'Artisan Chocolate Hamper',
      category: 'Food & Gourmet', price: 1799, original: 2200,
      image: 'https://images.unsplash.com/photo-1549007953-2f2dc0b24019?w=600&q=80',
      desc: 'Hand-crafted Belgian chocolates, imported truffles, and gourmet treats in a stunning wicker hamper.',
      features: ['Belgian & Swiss chocolates', 'Custom name engraving option', '18 premium assorted pieces', 'Reusable wicker basket', 'Vegetarian & vegan options'],
      rating: 4.6, reviews: 2100,
      platforms: [
        { name: 'Bigbasket', price: 1799, url: 'https://www.bigbasket.com/ps/?q=chocolate+gift+hamper', best: true },
        { name: 'Amazon', price: 1949, url: 'https://www.amazon.in/s?k=chocolate+hamper+gift', best: false },
        { name: 'Zomato Market', price: 2050, url: 'https://www.zomato.com', best: false },
      ],
      tags: ['female', 'male', 'food'],
    },
    {
      id: 'b4', name: 'Spa & Wellness Gift Kit',
      category: 'Wellness', price: 1299, original: 1800,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
      desc: 'A blissful self-care collection with essential oils, bath salts, a jade roller, and luxury candles.',
      features: ['Organic essential oils', 'Himalayan bath salts', 'Jade facial roller', 'Soy wax aromatherapy candle', 'Konjac cleansing sponge'],
      rating: 4.8, reviews: 560,
      platforms: [
        { name: 'Nykaa', price: 1299, url: 'https://www.nykaa.com/beauty-gifts', best: true },
        { name: 'The Body Shop', price: 1599, url: 'https://www.thebodyshop.com/en-in/gifts', best: false },
        { name: 'Amazon', price: 1450, url: 'https://www.amazon.in/s?k=spa+gift+kit', best: false },
      ],
      tags: ['female', 'wellness'],
    },
  ],

  anniversary: [
    {
      id: 'a1', name: 'Couple Zodiac Bracelet Set',
      category: 'Jewellery', price: 1599, original: 2400,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
      desc: 'Matching sterling silver bracelets with engraved zodiac constellations — a timeless symbol of your bond.',
      features: ['925 sterling silver', 'Custom zodiac engraving', 'Adjustable fit', 'Anti-tarnish coating', 'Gift boxed'],
      rating: 4.9, reviews: 3400,
      platforms: [
        { name: 'CaratLane', price: 1599, url: 'https://www.caratlane.com/jewellery/bracelets', best: true },
        { name: 'Tanishq', price: 1899, url: 'https://www.tanishq.co.in', best: false },
        { name: 'Flipkart', price: 1750, url: 'https://www.flipkart.com/silver-bracelets', best: false },
      ],
      tags: ['female', 'male', 'couple', 'luxury'],
    },
    {
      id: 'a2', name: 'Custom Love Story Book',
      category: 'Memories', price: 1299, original: 1799,
      image: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&q=80',
      desc: 'A personalised hardcover storybook narrating your unique love journey with custom illustrations and milestones.',
      features: ['20+ personalised pages', 'Premium hardcover', 'Custom illustrations', 'Your photos included', 'Worldwide delivery'],
      rating: 5.0, reviews: 420,
      platforms: [
        { name: 'Wonderbly', price: 1299, url: 'https://www.wonderbly.com', best: true },
        { name: 'Picaboo', price: 1599, url: 'https://www.picaboo.com', best: false },
        { name: 'Snapfish', price: 1450, url: 'https://www.snapfish.in', best: false },
      ],
      tags: ['female', 'male', 'sentimental'],
    },
    {
      id: 'a3', name: 'Fine Dining Experience Voucher',
      category: 'Experiences', price: 3999, original: 5000,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
      desc: 'An unforgettable 5-star dining experience for two at India\'s most celebrated restaurants — candlelit and curated.',
      features: ['5-star restaurant voucher', 'Valid 6 months', '3-course chef\'s menu', 'Complimentary wine', 'Table-side personalization'],
      rating: 4.8, reviews: 890,
      platforms: [
        { name: 'EazyDiner', price: 3999, url: 'https://www.eazydiner.com/dining-voucher', best: true },
        { name: 'Dineout', price: 4499, url: 'https://www.dineout.co.in/vouchers', best: false },
        { name: 'Zomato Pro', price: 4200, url: 'https://www.zomato.com/pro', best: false },
      ],
      tags: ['female', 'male', 'experience', 'luxury'],
    },
  ],

  baby_shower: [
    {
      id: 'bs1', name: 'Organic Baby Hamper',
      category: 'Baby Care', price: 2199, original: 2800,
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
      desc: 'A thoughtfully curated organic baby hamper with skincare, plush toys, clothes, and feeding essentials.',
      features: ['100% organic cotton onesie', 'Chemical-free skincare set', 'Plush rattle toy', 'Muslin swaddle blankets', 'Wooden teether ring'],
      rating: 4.9, reviews: 780,
      platforms: [
        { name: 'FirstCry', price: 2199, url: 'https://www.firstcry.com/baby-shower-gifts', best: true },
        { name: 'Amazon Baby', price: 2399, url: 'https://www.amazon.in/b?node=1571271031', best: false },
        { name: 'Hopscotch', price: 2599, url: 'https://www.hopscotch.in', best: false },
      ],
      tags: ['baby', 'organic', 'gift'],
    },
    {
      id: 'bs2', name: 'Personalised Baby Keepsake Box',
      category: 'Memories', price: 1499, original: 1999,
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80',
      desc: 'A beautifully crafted wooden keepsake box engraved with the baby\'s name and birthdate — to store cherished memories.',
      features: ['Engraved name & date', 'Premium birchwood', 'Velvet lining', 'Lock & key', 'Lifetime keepsake'],
      rating: 4.9, reviews: 340,
      platforms: [
        { name: 'Etsy India', price: 1499, url: 'https://www.etsy.com/in-en/search?q=baby+keepsake+box', best: true },
        { name: 'IGP', price: 1799, url: 'https://www.igp.com/baby-gifts', best: false },
        { name: 'Ferns N Petals', price: 1699, url: 'https://www.fnp.com/baby-shower-gifts', best: false },
      ],
      tags: ['baby', 'sentimental', 'custom'],
    },
  ],

  proposal: [
    {
      id: 'p1', name: 'Diamond Solitaire Ring Box Set',
      category: 'Fine Jewellery', price: 15999, original: 22000,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
      desc: 'A breathtaking solitaire diamond ring in a velvet presentation box — make the moment eternal.',
      features: ['IGI certified diamond', '18K white/yellow gold options', 'Custom engraving inside', 'Lifetime resizing', 'Certificate of authenticity'],
      rating: 5.0, reviews: 2900,
      platforms: [
        { name: 'CaratLane', price: 15999, url: 'https://www.caratlane.com/solitaire-rings', best: true },
        { name: 'BlueStone', price: 17499, url: 'https://www.bluestone.com/diamond-rings', best: false },
        { name: 'Tanishq', price: 18999, url: 'https://www.tanishq.co.in/rings', best: false },
      ],
      tags: ['female', 'luxury', 'proposal'],
    },
    {
      id: 'p2', name: 'Rose Petal Room Setup Service',
      category: 'Experience', price: 3999, original: 5500,
      image: 'https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=600&q=80',
      desc: 'A professional romantic room decoration with rose petals, candles, and a personalised message — delivered to any hotel.',
      features: ['1000+ red rose petals', '50 scented candles', 'Balloon arch', 'Personalised message board', 'Coordination with hotel'],
      rating: 4.8, reviews: 1560,
      platforms: [
        { name: 'BookEventz', price: 3999, url: 'https://www.bookeventz.com/romantic-decoration', best: true },
        { name: 'Zzeeh', price: 4499, url: 'https://www.zzeeh.com', best: false },
        { name: 'Amazon Services', price: 4799, url: 'https://www.amazon.in/s?k=rose+petal+room+decoration', best: false },
      ],
      tags: ['experience', 'romantic', 'proposal'],
    },
  ],

  breakup: [
    {
      id: 'br1', name: 'Self-Love & Healing Journal',
      category: 'Wellness', price: 699, original: 999,
      image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&q=80',
      desc: 'A guided journal with daily affirmations, gratitude prompts, and healing exercises — your companion through every chapter.',
      features: ['200 guided pages', 'Daily affirmations', 'Mental clarity prompts', 'Premium hardcover', 'Bookmark ribbon included'],
      rating: 4.8, reviews: 1800,
      platforms: [
        { name: 'Amazon', price: 699, url: 'https://www.amazon.in/s?k=self+love+journal', best: true },
        { name: 'Flipkart', price: 799, url: 'https://www.flipkart.com/self-help-journals', best: false },
        { name: 'Notion Press', price: 850, url: 'https://notionpress.com', best: false },
      ],
      tags: ['female', 'male', 'healing', 'wellness'],
    },
    {
      id: 'br2', name: 'Comfort & Cosy Gift Box',
      category: 'Self Care', price: 1599, original: 2200,
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
      desc: 'A warm and cosy gift box with a plush blanket, gourmet hot chocolate, scented candle, and a novel — pure comfort.',
      features: ['Super-soft fleece blanket', 'Belgian hot chocolate mix', 'Lavender soy candle', 'Bestselling novel', 'Personalised card'],
      rating: 4.9, reviews: 660,
      platforms: [
        { name: 'Ferns N Petals', price: 1599, url: 'https://www.fnp.com/gift-hampers', best: true },
        { name: 'Amazon', price: 1799, url: 'https://www.amazon.in/s?k=comfort+gift+box', best: false },
        { name: 'Archies', price: 1850, url: 'https://www.archiesonline.com', best: false },
      ],
      tags: ['female', 'male', 'healing', 'comfort'],
    },
  ],

  surprise_visit: [
    {
      id: 'sv1', name: 'Gourmet Snack & Drink Hamper',
      category: 'Food & Drink', price: 1299, original: 1700,
      image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&q=80',
      desc: 'A delightful hamper packed with artisan snacks, specialty teas, premium coffees, and gourmet nibbles.',
      features: ['12 artisan snack varieties', 'Darjeeling & herbal teas', 'Single-origin coffee sachets', 'Imported biscuits & nuts', 'Reusable gift basket'],
      rating: 4.7, reviews: 2340,
      platforms: [
        { name: 'Amazon', price: 1299, url: 'https://www.amazon.in/s?k=snack+hamper+gift', best: true },
        { name: 'Wingreens Farms', price: 1499, url: 'https://www.wingreensfarms.com', best: false },
        { name: 'Bigbasket', price: 1399, url: 'https://www.bigbasket.com/ps/?q=gift+hamper', best: false },
      ],
      tags: ['female', 'male', 'food', 'casual'],
    },
    {
      id: 'sv2', name: 'Potted Succulent & Planter Set',
      category: 'Home & Living', price: 849, original: 1200,
      image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80',
      desc: 'A curated set of three rare succulents in handcrafted ceramic planters — a living gift that grows with memories.',
      features: ['3 rare succulent varieties', 'Handmade ceramic pots', 'Care guide booklet', 'Organic soil mix', 'Long-lasting (5+ years)'],
      rating: 4.8, reviews: 1120,
      platforms: [
        { name: 'Ugaoo', price: 849, url: 'https://www.ugaoo.com/succulents', best: true },
        { name: 'Flipkart', price: 999, url: 'https://www.flipkart.com/plants-succulents', best: false },
        { name: 'Nurserylive', price: 950, url: 'https://nurserylive.com', best: false },
      ],
      tags: ['female', 'male', 'home', 'casual'],
    },
  ],
};

/* ── AI PRODUCT SUGGESTIONS via Claude API ── */
async function getAISuggestions(details) {
  const prompt = `You are an expert gift curator for an Indian e-commerce platform called GIFTRAvault.

A customer needs gift recommendations with these details:
- Recipient: ${details.recipientName || 'Loved one'}
- Age: ${details.age || 'Not specified'}
- Gender: ${details.gender || 'Not specified'}
- Occasion: ${details.occasion?.replace(/_/g, ' ') || 'Birthday'}
- Relationship: ${details.relationship || 'Not specified'}
- Personality: ${details.personality || 'Not specified'}
- Interests: ${details.interests?.join(', ') || 'General'}
- Budget: ₹${details.budget || 2000}
- Additional notes: ${details.note || 'None'}

Give a warm, personalized 2-3 sentence analysis of why specific gift types would resonate, and which 2-3 product categories to prioritize. Mention price sensitivity. Be specific, insightful, and emotionally intelligent. Keep it concise and conversational. Use Indian context where relevant.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await resp.json();
    return data.content?.[0]?.text || null;
  } catch (err) {
    console.error('AI suggestion error:', err);
    return null;
  }
}

async function getAIPriceAnalysis(products) {
  const productList = products.slice(0, 4).map(p =>
    `${p.name} (₹${p.price}) - ${p.category}`
  ).join('\n');

  const prompt = `You are a smart price comparison AI for GIFTRAvault.

For these gift products:
${productList}

Briefly explain in 1-2 sentences which product offers the best value for money and why, considering quality, price, and gifting impact. Be concise and mention the product name.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await resp.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

function renderProducts(products, aiText, priceText) {
  // AI summary
  const aiCard = $('aiSummaryCard');
  if (aiCard) {
    const aiThinking = aiCard.querySelector('.ai-thinking');
    if (aiThinking) {
      aiThinking.innerHTML = aiText
        ? aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        : 'I\'ve analysed your preferences and curated the <strong>best gifts</strong> for your loved one. Each pick has been cross-checked across platforms for the <strong>best price</strong>.';
    }
    aiCard.style.display = 'flex';
  }

  // Price analysis
  const priceAnalysis = $('priceAnalysis');
  if (priceAnalysis && priceText) {
    priceAnalysis.textContent = `💡 ${priceText}`;
    priceAnalysis.style.display = 'block';
  }

  const grid = $('productsGrid');
  if (!grid || !products.length) {
    if (grid) grid.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:40px">No products found for this occasion. Try adjusting filters.</p>';
    return;
  }

  grid.innerHTML = '';
  products.forEach((product, idx) => {
    const isAIPick = idx === 0;
    const card = document.createElement('div');
    card.className = `product-card slide-in-up${isAIPick ? ' ai-pick' : ''}`;
    card.style.animationDelay = (idx * 0.08) + 's';
    card.dataset.id = product.id;

    const bestPlatform = product.platforms.find(p => p.best);
    const stars = generateStars(product.rating);
    const discount = Math.round((1 - product.price / product.original) * 100);

    card.innerHTML = `
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80'">
        <div class="product-img-overlay"></div>
        <span class="product-platform-badge">${bestPlatform?.name || 'Amazon'}</span>
        <button class="product-wishlist" data-id="${product.id}" title="Add to wishlist">🤍</button>
      </div>
      <div class="product-body">
        <div class="product-category">${product.category}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.desc}</div>
        <div class="product-rating">
          <div class="stars">${stars}</div>
          <span class="rating-count">${product.rating} (${product.reviews.toLocaleString()})</span>
        </div>
        <div class="price-section">
          <div>
            <span class="price-main">${formatCurrency(product.price)}</span>
            <span class="price-original">${formatCurrency(product.original)}</span>
          </div>
          <span class="price-discount">-${discount}%</span>
        </div>
        <div class="price-compare-mini">
          <div class="price-compare-title">📊 Price Comparison</div>
          <div class="compare-rows">
            ${product.platforms.map(p => `
              <div class="compare-row${p.best ? ' cheapest' : ''}">
                <span class="c-name">${p.name}</span>
                <span class="c-price">${formatCurrency(p.price)} ${p.best ? '<span class="c-badge">BEST</span>' : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="product-actions">
          <a href="${bestPlatform?.url || '#'}" target="_blank" rel="noopener" class="btn-buy">🛒 Buy Now</a>
          <button class="btn-detail" onclick="openProductModal('${product.id}')">👁 Detail</button>
        </div>
      </div>
    `;

    // Wishlist
    card.querySelector('.product-wishlist').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const id = btn.dataset.id;
      if (APP.wishlist.has(id)) {
        APP.wishlist.delete(id); btn.textContent = '🤍'; btn.classList.remove('active');
        showToast('Removed from wishlist', '💔');
      } else {
        APP.wishlist.add(id); btn.textContent = '❤️'; btn.classList.add('active');
        showToast('Added to wishlist!', '❤️');
      }
    });

    grid.appendChild(card);
  });
}

function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '⭐'.repeat(full) + (half ? '✨' : '') + '☆'.repeat(empty);
}

/* Open product detail modal */
window.openProductModal = function(id) {
  const allProducts = Object.values(PRODUCT_DATABASE).flat();
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const overlay = $('productModal');
  if (!overlay) return;

  const discount = Math.round((1 - product.price / product.original) * 100);
  const bestPlatform = product.platforms.find(p => p.best);

  overlay.querySelector('.modal-grid').innerHTML = `
    <img class="modal-img" src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80'">
    <div class="modal-content">
      <div class="modal-badges">
        <span class="badge badge-gold">✦ ${product.category}</span>
        <span class="badge badge-best">-${discount}% OFF</span>
        ${id === APP.products[0]?.id ? '<span class="badge badge-ai">🤖 AI Pick</span>' : ''}
      </div>
      <div class="modal-title">${product.name}</div>
      <div class="modal-desc">${product.desc}</div>
      <div class="product-rating" style="margin-bottom:16px">
        <div class="stars">${generateStars(product.rating)}</div>
        <span class="rating-count">${product.rating} · ${product.reviews.toLocaleString()} reviews</span>
      </div>
      <div class="modal-features">
        <h4>✦ What's Included</h4>
        <div class="feature-list">
          ${product.features.map(f => `<div class="feature-item">${f}</div>`).join('')}
        </div>
      </div>
      <div class="modal-platforms">
        <h4>📊 Best Prices Across Platforms</h4>
        <div class="platform-rows">
          ${product.platforms.map(p => `
            <div class="platform-row${p.best ? ' best-deal' : ''}">
              <span class="p-name">${p.name}</span>
              <span class="p-price">${formatCurrency(p.price)}</span>
              ${p.best ? '<span class="p-best">CHEAPEST</span>' : ''}
              <a href="${p.url}" target="_blank" class="p-link">Visit →</a>
            </div>
          `).join('')}
        </div>
      </div>
      <a href="${bestPlatform?.url || '#'}" target="_blank" rel="noopener" class="modal-buy-btn">
        🛒 Buy at Best Price · ${formatCurrency(product.price)}
      </a>
    </div>
  `;

  overlay.classList.add('open');
};

function initProductsPage() {
  if (!$('productsGrid')) return;

  const details = getGiftDetails();
  const occasion = details.occasion || localStorage.getItem('giftra_occasion') || 'birthday';

  // Update page headers
  const occasionLabel = $('occasionLabel');
  if (occasionLabel) occasionLabel.textContent = occasion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const recipientLabel = $('recipientLabel');
  if (recipientLabel && details.recipientName) recipientLabel.textContent = `For ${details.recipientName}`;

  // Get products for occasion
  let products = PRODUCT_DATABASE[occasion] || PRODUCT_DATABASE.birthday;
  APP.products = products;

  // Filter buttons
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      APP.filterCategory = pill.dataset.filter;
      const filtered = APP.filterCategory === 'all'
        ? APP.products
        : APP.products.filter(p => p.tags.includes(APP.filterCategory));
      renderProducts(filtered, null, null);
    });
  });

  // Modal close
  const modalOverlay = $('productModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay || e.target.classList.contains('modal-close')) {
        modalOverlay.classList.remove('open');
      }
    });
  }

  // Initial render with loading
  const grid = $('productsGrid');
  grid.innerHTML = `
    <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:20px;padding:60px">
      <div class="ai-processing-ring" style="width:80px;height:80px">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="ring-center">🤖</div>
      </div>
      <p style="font-family:var(--font-serif);color:var(--gold-light);font-size:1.1rem">AI is curating your gifts…</p>
      <p style="color:var(--text-light);font-size:0.82rem">Comparing prices across Amazon, Flipkart, Nykaa & more</p>
    </div>
  `;

  // Async AI enhancement
  (async () => {
    const [aiText, priceText] = await Promise.all([
      getAISuggestions(details),
      getAIPriceAnalysis(products),
    ]);
    renderProducts(products, aiText, priceText);
  })();
}

/* ══════════════════════════════════════════
   BACK / NAV ACTIONS
   ══════════════════════════════════════════ */
function initBackButtons() {
  $$('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.back;
      setPage(target);
    });
  });
}

/* ══════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════ */
function initLogout() {
  $$('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('giftra_user');
      showToast('Signed out. See you soon! 👋', '✨');
      setTimeout(() => setPage('index.html'), 800);
    });
  });
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initLoginPage();
  initHomePage();
  initDetailsPage();
  initProductsPage();
  initBackButtons();
  initLogout();
});
