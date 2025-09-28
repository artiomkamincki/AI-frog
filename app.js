const STORAGE_KEY = 'ai-frog-shopping-list';

const ideaData = [
  {
    title: 'Смузи «Витаминный заряд»',
    badge: '5 минут',
    items: ['Шпинат', 'Банан', 'Миндальное молоко', 'Семена чиа'],
    description: 'Идеально для быстрого завтрака — просто смешайте все ингредиенты в блендере.',
  },
  {
    title: 'Ужин за 20 минут',
    badge: '2 порции',
    items: ['Филе лосося', 'Кускус', 'Стручковая фасоль', 'Лимон'],
    description: 'Запеките лосося, пока кускус заваривается, и подавайте с фасолью на пару.',
  },
  {
    title: 'Ланч-бокс на работу',
    badge: '310 ккал',
    items: ['Киноа', 'Нут', 'Черри', 'Оливковое масло'],
    description: 'Смешайте все с зеленью и храните в холодильнике до 3 дней.',
  },
  {
    title: 'Полезный перекус',
    badge: '0 сахара',
    items: ['Йогурт греческий', 'Орехи', 'Ягоды', 'Мёд'],
    description: 'Микс из белков и клетчатки помогает дольше оставаться сытым.',
  },
];

const tipsData = [
  {
    title: 'Планируйте меню на неделю',
    description: 'Заранее составленное меню экономит бюджет и сокращает спонтанные покупки.',
  },
  {
    title: 'Проверяйте холодильник перед походом',
    description: 'Записывайте, что уже есть дома, чтобы не покупать лишние продукты.',
  },
  {
    title: 'Используйте сезонные продукты',
    description: 'Сезонные овощи и фрукты дешевле и вкуснее круглый год.',
  },
  {
    title: 'Сканируйте чек',
    description: 'Сохраняйте чеки и анализируйте траты — так легче держать бюджет под контролем.',
  },
];

const shoppingList = new Map(readList().map((item) => [item.id, item]));

const selectors = {
  form: document.querySelector('#shopping-form'),
  itemInput: document.querySelector('#item-input'),
  list: document.querySelector('#shopping-list'),
  clearBtn: document.querySelector('#clear-list'),
  toast: document.querySelector('.toast'),
  ideaGrid: document.querySelector('#idea-grid'),
  ideaTemplate: document.querySelector('#idea-template'),
  tipsList: document.querySelector('#tips-list'),
  tipsTemplate: document.querySelector('#tips-template'),
  menuToggle: document.querySelector('.menu-toggle'),
  nav: document.querySelector('.app-nav'),
};

init();

function init() {
  renderShoppingList();
  renderIdeas();
  renderTips();
  setupForm();
  setupClear();
  setupMenuToggle();
  applyScrollRestoration();
}

function setupForm() {
  selectors.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = selectors.itemInput.value.trim();

    if (!value) {
      showToast('Введите название продукта');
      return;
    }

    const id = crypto.randomUUID();
    shoppingList.set(id, { id, label: value, status: 'new' });
    selectors.itemInput.value = '';
    selectors.itemInput.focus();
    persistList();
    renderShoppingList();
    showToast('Добавлено в список');
  });
}

function setupClear() {
  selectors.clearBtn?.addEventListener('click', () => {
    if (!shoppingList.size) {
      showToast('Список уже пуст');
      return;
    }

    const confirmed = window.confirm('Очистить весь список покупок?');
    if (confirmed) {
      shoppingList.clear();
      persistList();
      renderShoppingList();
      showToast('Список очищен');
    }
  });
}

function setupMenuToggle() {
  const { menuToggle, nav } = selectors;
  if (!menuToggle || !nav) return;

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.hidden = expanded;
  });

  nav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches('a')) {
      nav.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function applyScrollRestoration() {
  const saved = sessionStorage.getItem('ai-frog-scroll');
  if (saved) {
    requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
  }

  window.addEventListener('scroll', () => {
    sessionStorage.setItem('ai-frog-scroll', String(window.scrollY));
  });
}

function renderShoppingList() {
  const fragment = document.createDocumentFragment();

  for (const item of shoppingList.values()) {
    fragment.append(createShoppingItem(item));
  }

  selectors.list.replaceChildren(fragment);

  if (!shoppingList.size) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Пока пусто. Добавьте продукты из подборок или вручную.';
    selectors.list.append(empty);
  }
}

function createShoppingItem(item) {
  const li = document.createElement('li');
  li.className = 'shopping-item';
  li.dataset.status = item.status;
  li.role = 'listitem';

  const checkbox = document.createElement('button');
  checkbox.className = 'checkbox';
  checkbox.type = 'button';
  checkbox.setAttribute('aria-label', item.status === 'done' ? 'Вернуть в список' : 'Отметить как куплено');
  checkbox.innerHTML =
    '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.071 7.142a1 1 0 0 1-1.428.006L3.29 9.294a1 1 0 1 1 1.414-1.414l4.09 4.09 6.364-6.364a1 1 0 0 1 1.414-.006Z" clip-rule="evenodd" /></svg>';
  checkbox.addEventListener('click', () => toggleStatus(item.id));

  const label = document.createElement('span');
  label.textContent = item.label;
  label.className = 'shopping-label';

  const removeButton = document.createElement('button');
  removeButton.setAttribute('aria-label', `Удалить ${item.label}`);
  removeButton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>';
  removeButton.addEventListener('click', () => removeItem(item.id));

  li.append(checkbox, label, removeButton);
  return li;
}

function renderIdeas() {
  const { ideaGrid, ideaTemplate } = selectors;
  if (!ideaGrid || !ideaTemplate) return;

  const template = ideaTemplate.content.firstElementChild;
  const fragment = document.createDocumentFragment();

  ideaData.forEach((idea) => {
    const card = template.cloneNode(true);
    card.querySelector('h3').textContent = idea.title;
    card.querySelector('.idea-badge').textContent = idea.badge;

    const itemsList = card.querySelector('.idea-items');
    itemsList.innerHTML = idea.items.map((item) => `<li>${item}</li>`).join('');

    card.querySelector('.idea-desc').textContent = idea.description;

    const addButton = card.querySelector('button');
    addButton.addEventListener('click', () => {
      idea.items.forEach((label) => addItem(label));
      showToast('Продукты добавлены в список');
    });

    fragment.append(card);
  });

  ideaGrid.replaceChildren(fragment);
}

function renderTips() {
  const { tipsList, tipsTemplate } = selectors;
  if (!tipsList || !tipsTemplate) return;

  const template = tipsTemplate.content.firstElementChild;
  const fragment = document.createDocumentFragment();

  tipsData.forEach((tip) => {
    const node = template.cloneNode(true);
    node.querySelector('h3').textContent = tip.title;
    node.querySelector('p').textContent = tip.description;
    fragment.append(node);
  });

  tipsList.replaceChildren(fragment);
}

function addItem(label) {
  const existing = [...shoppingList.values()].find((item) => item.label.toLowerCase() === label.toLowerCase());
  if (existing) {
    toggleStatus(existing.id, 'new');
    return;
  }

  const id = crypto.randomUUID();
  shoppingList.set(id, { id, label, status: 'new' });
  persistList();
  renderShoppingList();
}

function toggleStatus(id, explicit) {
  const item = shoppingList.get(id);
  if (!item) return;

  item.status = explicit ?? (item.status === 'done' ? 'new' : 'done');
  shoppingList.set(id, item);
  persistList();
  renderShoppingList();
}

function removeItem(id) {
  shoppingList.delete(id);
  persistList();
  renderShoppingList();
  showToast('Удалено из списка');
}

function readList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Не удалось прочитать список', error);
    return [];
  }
}

function persistList() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...shoppingList.values()]));
  } catch (error) {
    console.error('Не удалось сохранить список', error);
  }
}

function showToast(message) {
  const { toast } = selectors;
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;
  toast.setAttribute('aria-hidden', 'false');

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.setAttribute('aria-hidden', 'true');
    toast.hidden = true;
  }, 1800);
}

window.addEventListener('beforeunload', () => {
  sessionStorage.removeItem('ai-frog-scroll');
});
