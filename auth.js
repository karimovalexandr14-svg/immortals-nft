// IMMORTALS Auth (Supabase)
let supabaseClient = null;
let currentUser = null;
let isAuthenticated = false;

async function initSupabase() {
  try {
    const config = await fetch('config.json').then(r => r.json());
    
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Проверяем сессию
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      currentUser = data.session.user;
      isAuthenticated = true;
      await loadPlayerProfile();
      // Сигнализируем приложению что авторизованы
      window.authReady = true;
    } else {
      isAuthenticated = false;
      window.authReady = false;
      showAuthScreenOverlay();
    }
  } catch (err) {
    console.log('Supabase не доступен, используем гостевой режим');
    window.authReady = true; // Продолжаем с гостевым режимом
  }
}

async function signUp(email, password, username) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    
    if (error) throw error;
    currentUser = data.user;
    isAuthenticated = true;
    
    // Создаём профиль
    await supabaseClient.from('profiles').insert({
      id: currentUser.id,
      username,
      nickname: username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
      balance: 5000,
      inventory: [],
      stats: { upgrades: 0, trades: 0, purchases: 0 }
    });
    
    await loadPlayerProfile();
    hideAuthScreenOverlay();
    initApp();
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

async function signIn(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    currentUser = data.user;
    isAuthenticated = true;
    await loadPlayerProfile();
    hideAuthScreenOverlay();
    initApp();
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

async function loadPlayerProfile() {
  if (!currentUser) return;
  
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  if (data) {
    window.playerData = {
      id: currentUser.id,
      email: currentUser.email,
      nickname: data.nickname,
      avatar: data.avatar_url,
      balance: data.balance,
      inventory: data.inventory || [],
      stats: data.stats || { upgrades: 0, trades: 0, purchases: 0 },
      activeCast: data.active_cast || 'rookie',
      userAccent: data.user_accent || '#22c55e'
    };
  }
}

async function updatePlayerData() {
  if (!currentUser || !window.playerData) return;
  
  await supabaseClient.from('profiles')
    .update({
      balance: window.playerData.balance,
      inventory: window.playerData.inventory,
      stats: window.playerData.stats,
      active_cast: window.playerData.activeCast,
      user_accent: window.playerData.userAccent,
      updated_at: new Date()
    })
    .eq('id', currentUser.id);
}

async function signOut() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  isAuthenticated = false;
  window.playerData = null;
  showAuthScreenOverlay();
}

function showAuthScreenOverlay() {
  let overlay = document.getElementById('authOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.innerHTML = `
      <div class="mobile-wrapper" style="padding: 0; position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 9999; max-width: 450px; width: 100%; height: 100vh;">
        <div style="padding: 40px 20px; display: flex; flex-direction: column; justify-content: center; height: 100vh; background: #0f172a;">
          <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 10px; color: white; text-align: center;">immortals</h1>
          <p style="text-align: center; color: #64748b; margin-bottom: 40px; font-weight: 600;">NFT Market</p>
          
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <input type="email" id="authEmail" placeholder="Email" style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 12px; color: white; font-size: 16px; width: 100%;">
            <input type="password" id="authPassword" placeholder="Password" style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 12px; color: white; font-size: 16px; width: 100%;">
            <input type="text" id="authUsername" placeholder="Username" style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 12px; color: white; font-size: 16px; width: 100%;">
            
            <button id="signInBtn" style="background: #22c55e; color: black; border: none; padding: 15px; border-radius: 12px; font-weight: 900; cursor: pointer;">Sign In</button>
            <button id="signUpBtn" style="background: #3b82f6; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 900; cursor: pointer;">Sign Up</button>
            <button id="guestBtn" style="background: #475569; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 900; cursor: pointer;">Continue as Guest</button>
          </div>
          
          <p id="authError" style="color: #ef4444; margin-top: 20px; text-align: center; font-weight: 600;"></p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    document.getElementById('signInBtn').onclick = async () => {
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;
      if (!email || !password) {
        document.getElementById('authError').textContent = 'Fill email and password';
        return;
      }
      const result = await signIn(email, password);
      if (result.error) document.getElementById('authError').textContent = result.error;
    };
    
    document.getElementById('signUpBtn').onclick = async () => {
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;
      const username = document.getElementById('authUsername').value;
      if (!email || !password || !username) {
        document.getElementById('authError').textContent = 'Fill all fields';
        return;
      }
      const result = await signUp(email, password, username);
      if (result.error) document.getElementById('authError').textContent = result.error;
    };
    
    document.getElementById('guestBtn').onclick = () => {
      hideAuthScreenOverlay();
      initGuestUser();
      initApp();
    };
  }
  overlay.style.display = 'flex';
}

function hideAuthScreenOverlay() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';
}

// На старте
initSupabase();
