// الثوابت والمتغيرات العامة
const LOCAL_KEY = 'agenda_tasks_v1_html';
const ALERTS_KEY = 'agenda_alerts_settings';
let tasks = [];
let editingId = null;
let filter = 'all';
let alertsInterval = null;

// عناصر DOM
const elements = {
    form: document.getElementById('taskForm'),
    title: document.getElementById('title'),
    desc: document.getElementById('desc'),
    due: document.getElementById('due'),
    priority: document.getElementById('priority'),
    alertDate: document.getElementById('alertDate'),
    alertTime: document.getElementById('alertTime'),
    alertEnabled: document.getElementById('alertEnabled'),
    tasksList: document.getElementById('tasksList'),
    search: document.getElementById('search'),
    totalCount: document.getElementById('totalCount'),
    visibleCount: document.getElementById('visibleCount'),
    saveBtn: document.getElementById('saveBtn'),
    cancelEdit: document.getElementById('cancelEdit'),
    clearForm: document.getElementById('clearForm'),
    exportExcel: document.getElementById('exportExcel'),
    importExcel: document.getElementById('importExcel'),
    importExcelBtn: document.getElementById('importExcelBtn'),
    printBtn: document.getElementById('printBtn'),
    clearAll: document.getElementById('clearAll'),
    filters: document.getElementById('filters'),
    formTitle: document.getElementById('formTitle'),
    shareWhatsApp: document.getElementById('shareWhatsApp'),
    shareGoogle: document.getElementById('shareGoogle'),
    viewAlerts: document.getElementById('viewAlerts'),
    testAlert: document.getElementById('testAlert'),
    whatsappModal: document.getElementById('whatsappModal'),
    googleModal: document.getElementById('googleModal'),
    alertsModal: document.getElementById('alertsModal'),
    whatsappNumber: document.getElementById('whatsappNumber'),
    googleEmail: document.getElementById('googleEmail'),
    alertsPhone: document.getElementById('alertsPhone'),
    alertsList: document.getElementById('alertsList'),
    sendWhatsApp: document.getElementById('sendWhatsApp'),
    sendGoogle: document.getElementById('sendGoogle'),
    saveAlerts: document.getElementById('saveAlerts'),
    printSummary: document.getElementById('printSummary'),
    printTotalCount: document.getElementById('printTotalCount'),
    printDoneCount: document.getElementById('printDoneCount'),
    printPendingCount: document.getElementById('printPendingCount'),
    printHighPriorityCount: document.getElementById('printHighPriorityCount'),
    printTodayCount: document.getElementById('printTodayCount'),
    printWeekCount: document.getElementById('printWeekCount'),
    printDate: document.getElementById('printDate')
};

// إعدادات التنبيهات
let alertsSettings = {
    phoneNumber: '',
    enabled: true
};

// توليد معرف فريد
function uid() {
    return Math.random().toString(36).slice(2, 9);
}

// إدارة التخزين
function loadTasks() {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('فشل تحميل المهام:', e);
        tasks = [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('فشل الحفظ', e);
    }
}

function loadAlertsSettings() {
    try {
        const raw = localStorage.getItem(ALERTS_KEY);
        alertsSettings = raw ? JSON.parse(raw) : { phoneNumber: '', enabled: true };
    } catch (e) {
        console.error('فشل تحميل إعدادات التنبيهات:', e);
        alertsSettings = { phoneNumber: '', enabled: true };
    }
}

function saveAlertsSettings() {
    try {
        localStorage.setItem(ALERTS_KEY, JSON.stringify(alertsSettings));
        startAlertsMonitoring();
        renderAlertsList();
        alert('تم حفظ إعدادات التنبيهات بنجاح');
        elements.alertsModal.style.display = 'none';
        } catch (e) {
        console.error('فشل حفظ إعدادات التنبيهات', e);
    }
}

// تنسيق التاريخ
function formatLocalDate(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ar-EG');
    } catch (e) {
        return isoString;
    }
}

// إنشاء تاريخ تنبيه
function createAlertDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    
    try {
        const [hours, minutes] = timeStr.split(':');
        const alertDate = new Date(dateStr);
        alertDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return alertDate.toISOString();
    } catch (e) {
        console.error('خطأ في إنشاء تاريخ التنبيه:', e);
        return null;
    }
}

// التحقق من التنبيهات
function checkAlerts() {
    const now = new Date();
    const nowTime = now.getTime();
    
    tasks.forEach(task => {
        if (task.alert && task.alert.enabled && !task.alert.sent) {
            const alertTime = new Date(task.alert.datetime).getTime();
            
            // إذا حان وقت التنبيه (مع هامش ±1 دقيقة)
            if (Math.abs(alertTime - nowTime) < 60000) {
                sendWhatsAppAlert(task);
                // تعليم التنبيه كمرسل
                task.alert.sent = true;
                saveTasks();
                renderTasks();
            }
        }
    });
}

// بدء مراقبة التنبيهات
function startAlertsMonitoring() {
    if (alertsInterval) {
        clearInterval(alertsInterval);
    }
    
    if (alertsSettings.enabled && alertsSettings.phoneNumber) {
        alertsInterval = setInterval(checkAlerts, 30000); // التحقق كل 30 ثانية
        console.log('بدأت مراقبة التنبيهات');
    }
}

// إرسال تنبيه واتساب
function sendWhatsAppAlert(task) {
    if (!alertsSettings.phoneNumber) {
        console.warn('لم يتم تعيين رقم واتساب للتنبيهات');
        return;
    }

    const message = `🔔 *تنبيه مهمة*\n\n` +
                   `*${task.title}*\n` +
                   (task.desc ? `📝 ${task.desc}\n` : '') +
                   (task.due ? `⏰ موعد الاستحقاق: ${formatLocalDate(task.due)}\n` : '') +
                   `📍 الأولوية: ${task.priority}\n\n` +
                   `*لا تنسى إنجاز هذه المهمة!*`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${alertsSettings.phoneNumber}?text=${encodedMessage}`;
    
    // فتح نافذة جديدة لإرسال الرسالة
    window.open(whatsappUrl, '_blank');
    
    // إشعار للمستخدم
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('تم إرسال تنبيه واتساب', {
            body: `تم إرسال تنبيه للمهمة: ${task.title}`,
            icon: '/favicon.ico'
        });
    }
}

// اختبار إرسال تنبيه
function testWhatsAppAlert() {
    if (!alertsSettings.phoneNumber) {
        alert('الرجاء تعيين رقم واتساب أولاً من خلال "عرض التنبيهات"');
        return;
    }

    const testTask = {
        title: 'هذا اختبار للتنبيه',
        desc: 'إذا استلمت هذه الرسالة، فإن نظام التنبيهات يعمل بشكل صحيح',
        priority: 'عالية',
        due: new Date().toISOString()
    };

    sendWhatsAppAlert(testTask);
}

// عرض قائمة التنبيهات
function renderAlertsList() {
    elements.alertsList.innerHTML = '';
    elements.alertsPhone.value = alertsSettings.phoneNumber;
    
    const upcomingAlerts = tasks
        .filter(task => task.alert && task.alert.enabled && !task.alert.sent)
        .sort((a, b) => new Date(a.alert.datetime) - new Date(b.alert.datetime));
    
    if (upcomingAlerts.length === 0) {
        elements.alertsList.innerHTML = '<div class="empty">لا توجد تنبيهات قادمة</div>';
        return;
    }
    
    upcomingAlerts.forEach(task => {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        
        const alertInfo = document.createElement('div');
        alertInfo.innerHTML = `
            <div><strong>${task.title}</strong></div>
            <div class="small">${formatLocalDate(task.alert.datetime)}</div>
        `;
        
        const alertActions = document.createElement('div');
        alertActions.className = 'alert-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => {
            task.alert.enabled = false;
            saveTasks();
            renderAlertsList();
            renderTasks();
        };
        
        alertActions.appendChild(deleteBtn);
        alertItem.appendChild(alertInfo);
        alertItem.appendChild(alertActions);
        elements.alertsList.appendChild(alertItem);
    });
}

// حساب الإحصائيات للطباعة
function calculatePrintStats() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const stats = {
        total: tasks.length,
        done: tasks.filter(task => task.done).length,
        pending: tasks.filter(task => !task.done).length,
        highPriority: tasks.filter(task => task.priority === 'عالية').length,
        today: tasks.filter(task => {
            if (!task.due) return false;
            const dueDate = new Date(task.due);
            return dueDate.getDate() === now.getDate() && 
                   dueDate.getMonth() === now.getMonth() && 
                   dueDate.getFullYear() === now.getFullYear();
        }).length,
        week: tasks.filter(task => {
            if (!task.due) return false;
            const dueDate = new Date(task.due);
            return dueDate >= startOfWeek && dueDate < endOfWeek;
        }).length
    };

    return stats;
}

// تحديث إحصائيات الطباعة
function updatePrintStats() {
    const stats = calculatePrintStats();
    
    elements.printTotalCount.textContent = stats.total;
    elements.printDoneCount.textContent = stats.done;
    elements.printPendingCount.textContent = stats.pending;
    elements.printHighPriorityCount.textContent = stats.highPriority;
    elements.printTodayCount.textContent = stats.today;
    elements.printWeekCount.textContent = stats.week;
    
    // تحديث تاريخ الطباعة
    const now = new Date();
    elements.printDate.textContent = now.toLocaleDateString('ar-EG') + ' ' + now.toLocaleTimeString('ar-EG');
}

// وظيفة الطباعة
function printSummary() {
    // تحديث الإحصائيات قبل الطباعة
    updatePrintStats();
    
    // إظهار قسم الطباعة
    elements.printSummary.style.display = 'block';
    
    // الانتظار قليلاً لضمان تحميل المحتوى ثم الطباعة
    setTimeout(() => {
        window.print();
        
        // إخفاء قسم الطباعة بعد الانتهاء
        setTimeout(() => {
            elements.printSummary.style.display = 'none';
        }, 100);
    }, 100);
}

// عرض المهام
function renderTasks() {
    const query = (elements.search.value || '').trim().toLowerCase();
    const now = new Date();
    
    // حساب بداية ونهاية الأسبوع
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // تطبيق الفلترة
    let filteredTasks = tasks.filter(task => {
        // فلتر حسب الحالة
        if (filter === 'done' && !task.done) return false;
        
        // فلتر حسب التاريخ
        if (filter === 'today') {
            if (!task.due) return false;
            const dueDate = new Date(task.due);
            return dueDate.getDate() === now.getDate() && 
                   dueDate.getMonth() === now.getMonth() && 
                   dueDate.getFullYear() === now.getFullYear();
        }
        
        if (filter === 'week') {
            if (!task.due) return false;
            const dueDate = new Date(task.due);
            return dueDate >= startOfWeek && dueDate < endOfWeek;
        }
        
        return true;
    }).filter(task => {
        // تطبيق البحث
        if (!query) return true;
        return (task.title || '').toLowerCase().includes(query) || 
               (task.desc || '').toLowerCase().includes(query);
    });

    // عرض المهام
    elements.tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        elements.tasksList.innerHTML = '<div class="card empty">لا توجد مهام لعرضها.</div>';
    } else {
        const fragment = document.createDocumentFragment();
        
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            fragment.appendChild(taskElement);
        });
        
        elements.tasksList.appendChild(fragment);
    }

    // تحديث الإحصائيات
    elements.totalCount.textContent = tasks.length;
    elements.visibleCount.textContent = filteredTasks.length;
}

// إنشاء عنصر المهمة
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'card task';
    
    // إضافة شارة التنبيه إذا كان مفعل
    if (task.alert && task.alert.enabled && !task.alert.sent) {
        const alertBadge = document.createElement('div');
        alertBadge.className = 'alert-badge';
        alertBadge.innerHTML = '<i class="fas fa-bell"></i>';
        alertBadge.title = `تنبيه مفعل: ${formatLocalDate(task.alert.datetime)}`;
        taskDiv.appendChild(alertBadge);
    }
    
    // محتوى المهمة
    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'task-title';
    if (task.done) titleDiv.classList.add('line-through');
    titleDiv.textContent = task.title;
    
    const descDiv = document.createElement('div');
    descDiv.className = 'task-desc';
    descDiv.textContent = task.desc || '';
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';
    const dueText = task.due ? `موعد الاستحقاق: ${formatLocalDate(task.due)} • ` : '';
    const alertText = task.alert && task.alert.enabled ? `تنبيه: ${formatLocalDate(task.alert.datetime)} • ` : '';
    metaDiv.textContent = `${dueText}${alertText}الأولوية: ${task.priority || 'متوسطة'}`;
    
    contentDiv.appendChild(titleDiv);
    if (task.desc) contentDiv.appendChild(descDiv);
    contentDiv.appendChild(metaDiv);
    
    // أزرار المهمة
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    
    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn-success';
    doneBtn.innerHTML = task.done ? '<i class="fas fa-undo"></i> إلغاء' : '<i class="fas fa-check"></i> تم';
    doneBtn.onclick = () => toggleTaskDone(task.id);
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-muted';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> تعديل';
    editBtn.onclick = () => startEditTask(task.id);
    
    const alertBtn = document.createElement('button');
    alertBtn.className = task.alert && task.alert.enabled ? 'btn-warning' : 'btn-muted';
    alertBtn.innerHTML = task.alert && task.alert.enabled ? '<i class="fas fa-bell"></i>' : '<i class="fas fa-bell-slash"></i>';
    alertBtn.title = task.alert && task.alert.enabled ? 'تعطيل التنبيه' : 'تفعيل التنبيه';
    alertBtn.onclick = () => toggleTaskAlert(task.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> حذف';
    deleteBtn.onclick = () => {
        if (confirm('حذف المهمة؟')) {
            removeTask(task.id);
        }
    };
    
    actionsDiv.appendChild(doneBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(alertBtn);
    actionsDiv.appendChild(deleteBtn);
    
    taskDiv.appendChild(contentDiv);
    taskDiv.appendChild(actionsDiv);
    
    return taskDiv;
}

// عمليات المهام
function addTask(payload) {
    // إعداد التنبيه إذا كان مفعل
    let alertData = null;
    if (elements.alertEnabled.value === 'yes' && elements.alertDate.value && elements.alertTime.value) {
        const alertDateTime = createAlertDateTime(elements.alertDate.value, elements.alertTime.value);
        if (alertDateTime) {
            alertData = {
                datetime: alertDateTime,
                enabled: true,
                sent: false
            };
        }
    }
    
    tasks.unshift({
        id: uid(),
        createdAt: new Date().toISOString(),
        done: false,
        alert: alertData,
        ...payload
    });
    saveTasks();
    renderTasks();
}

function updateTask(id, payload) {
    // تحديث التنبيه إذا كان مفعل
    let alertData = null;
    if (elements.alertEnabled.value === 'yes' && elements.alertDate.value && elements.alertTime.value) {
        const alertDateTime = createAlertDateTime(elements.alertDate.value, elements.alertTime.value);
        if (alertDateTime) {
            alertData = {
                datetime: alertDateTime,
                enabled: true,
                sent: false
            };
        }
    }
    
    tasks = tasks.map(task => 
        task.id === id ? { ...task, ...payload, alert: alertData } : task
    );
    saveTasks();
    renderTasks();
}

function removeTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTaskDone(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, done: !task.done } : task
    );
    saveTasks();
    renderTasks();
}

function toggleTaskAlert(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            if (task.alert) {
                return {
                    ...task,
                    alert: {
                        ...task.alert,
                        enabled: !task.alert.enabled
                    }
                };
            } else {
                // إذا لم يكن هناك تنبيه، إنشاء واحد جديد
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                
                return {
                    ...task,
                    alert: {
                        datetime: tomorrow.toISOString(),
                        enabled: true,
                        sent: false
                    }
                };
            }
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

// تعديل المهمة
function startEditTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingId = id;
    elements.formTitle.textContent = 'تعديل المهمة';
    elements.saveBtn.textContent = 'حفظ التعديلات';
    elements.cancelEdit.style.display = 'inline-block';
    
    elements.title.value = task.title || '';
    elements.desc.value = task.desc || '';
    
    if (task.due) {
        const date = new Date(task.due);
        const pad = (n) => n.toString().padStart(2, '0');
        const localDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        elements.due.value = localDateTime;
    } else {
        elements.due.value = '';
    }
    
    elements.priority.value = task.priority || 'متوسطة';
    
    // تعيين حقول التنبيه
    if (task.alert) {
        const alertDate = new Date(task.alert.datetime);
        elements.alertDate.value = alertDate.toISOString().split('T')[0];
        elements.alertTime.value = `${alertDate.getHours().toString().padStart(2, '0')}:${alertDate.getMinutes().toString().padStart(2, '0')}`;
        elements.alertEnabled.value = task.alert.enabled ? 'yes' : 'no';
    } else {
        elements.alertDate.value = '';
        elements.alertTime.value = '09:00';
        elements.alertEnabled.value = 'no';
    }
    
    // التمرير إلى الأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stopEdit() {
    editingId = null;
    elements.formTitle.textContent = 'إضافة مهمة جديدة';
    elements.saveBtn.textContent = 'إضافة';
    elements.cancelEdit.style.display = 'none';
    elements.form.reset();
    
    // إعادة تعيين حقول التنبيه
    elements.alertDate.value = '';
    elements.alertTime.value = '09:00';
    elements.alertEnabled.value = 'no';
}

// تصدير إلى Excel
function exportToExcel() {
    if (tasks.length === 0) {
        alert('لا توجد مهام لتصديرها.');
        return;
    }

    try {
        // تحضير البيانات للتصدير
        const excelData = tasks.map(task => ({
            'العنوان': task.title || '',
            'الوصف': task.desc || '',
            'تاريخ الإنشاء': task.createdAt ? formatLocalDate(task.createdAt) : '',
            'موعد الاستحقاق': task.due ? formatLocalDate(task.due) : '',
            'الأولوية': task.priority || 'متوسطة',
            'الحالة': task.done ? 'مكتملة' : 'غير مكتملة',
            'تنبيه': task.alert && task.alert.enabled ? formatLocalDate(task.alert.datetime) : 'غير مفعل',
            'المعرف': task.id || ''
        }));

        // إنشاء ورقة عمل
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // إنشاء مصنف وإضافة الورقة
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المهام');
        
        // تصدير الملف
        XLSX.writeFile(workbook, 'مهام_جدول_الأعمال.xlsx');
        
    } catch (error) {
        console.error('خطأ في تصدير Excel:', error);
        alert('حدث خطأ أثناء تصدير الملف. الرجاء المحاولة مرة أخرى.');
    }
}

// استيراد من Excel
function importFromExcel(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // الحصول على الورقة الأولى
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                alert('الملف لا يحتوي على بيانات.');
                return;
            }
            
            // تحويل البيانات إلى تنسيق المهام
            const importedTasks = jsonData.map(row => {
                // البحث عن الأعمدة باللغتين العربية والإنجليزية
                const title = row['العنوان'] || row['Title'] || '';
                const desc = row['الوصف'] || row['Description'] || '';
                const priority = row['الأولوية'] || row['Priority'] || 'متوسطة';
                const status = row['الحالة'] || row['Status'] || '';
                const due = row['موعد الاستحقاق'] || row['Due Date'] || '';
                const alert = row['تنبيه'] || row['Alert'] || '';
                const id = row['المعرف'] || row['ID'] || uid();
                
                // تحويل تاريخ الاستحقاق إذا كان موجوداً
                let dueDate = null;
                if (due) {
                    try {
                        dueDate = new Date(due).toISOString();
                    } catch (e) {
                        console.warn('تعذر تحويل تاريخ الاستحقاق:', due);
                    }
                }
                
                // تحويل تاريخ التنبيه إذا كان موجوداً
                let alertData = null;
                if (alert && alert !== 'غير مفعل') {
                    try {
                        alertData = {
                            datetime: new Date(alert).toISOString(),
                            enabled: true,
                            sent: false
                        };
                    } catch (e) {
                        console.warn('تعذر تحويل تاريخ التنبيه:', alert);
                    }
                }
                
                return {
                    id: id,
                    title: title,
                    desc: desc,
                    priority: priority,
                    due: dueDate,
                    alert: alertData,
                    done: status === 'مكتملة' || status === 'Completed' || false,
                    createdAt: new Date().toISOString()
                };
            }).filter(task => task.title); // استبعاد المهام بدون عنوان
            
            if (importedTasks.length === 0) {
                alert('لم يتم العثور على مهام صالحة في الملف.');
                return;
            }
            
            // دمج المهام المستوردة مع المهام الحالية
            tasks = [...importedTasks, ...tasks];
            saveTasks();
            renderTasks();
            
            alert(`تم استيراد ${importedTasks.length} مهمة بنجاح.`);
            
        } catch (error) {
            console.error('خطأ في استيراد Excel:', error);
            alert('حدث خطأ أثناء استيراد الملف. تأكد من صحة تنسيق الملف.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// مشاركة المهام
function formatTasksForSharing() {
    if (tasks.length === 0) {
        return "لا توجد مهام لمشاركتها.";
    }
    
    let message = "📋 *جدول المهام الخاص بي:*\n\n";
    
    tasks.forEach((task, index) => {
        const status = task.done ? "✅" : "⏳";
        const priorityIcon = task.priority === "عالية" ? "🔴" : 
                           task.priority === "متوسطة" ? "🟡" : "🟢";
        
        message += `${index + 1}. ${status} ${priorityIcon} *${task.title}*\n`;
        
        if (task.desc) {
            message += `   📝 ${task.desc}\n`;
        }
        
        if (task.due) {
            message += `   ⏰ ${formatLocalDate(task.due)}\n`;
        }
        
        message += "\n";
    });
    
    return message;
}

function shareViaWhatsApp() {
    const message = formatTasksForSharing();
    const encodedMessage = encodeURIComponent(message);
    
    // فتح النافذة لإدخال الرقم
    elements.whatsappModal.style.display = 'flex';
    elements.whatsappNumber.focus();
    
    // إعداد حدث الإرسال
    elements.sendWhatsApp.onclick = function() {
        const phoneNumber = elements.whatsappNumber.value.trim();
        
        if (!phoneNumber) {
            alert('الرجاء إدخال رقم الهاتف');
            return;
        }
        
        // فتح رابط واتساب
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // إغلاق النافذة
        elements.whatsappModal.style.display = 'none';
        elements.whatsappNumber.value = '';
    };
}

function shareViaGoogle() {
    const message = formatTasksForSharing();
    
    // فتح النافذة لإدخال البريد الإلكتروني
    elements.googleModal.style.display = 'flex';
    elements.googleEmail.focus();
    
    // إعداد حدث الإرسال
    elements.sendGoogle.onclick = function() {
        const email = elements.googleEmail.value.trim();
        
        if (!email) {
            alert('الرجاء إدخال البريد الإلكتروني');
            return;
        }
        
        // إنشاء رابط بريد إلكتروني
        const subject = encodeURIComponent("جدول المهام الخاص بي");
        const body = encodeURIComponent(message);
        const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // فتح عميل البريد الإلكتروني
        window.location.href = mailtoUrl;
        
        // إغلاق النافذة
        elements.googleModal.style.display = 'none';
        elements.googleEmail.value = '';
    };
}

// إعداد معالجات الأحداث
function setupEventListeners() {
    // نموذج المهمة
    elements.form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const payload = {
            title: elements.title.value.trim(),
            desc: elements.desc.value.trim(),
            due: elements.due.value ? new Date(elements.due.value).toISOString() : null,
            priority: elements.priority.value
        };
        
        if (!payload.title) {
            alert('الرجاء إدخال عنوان المهمة.');
            return;
        }
        
        if (editingId) {
            updateTask(editingId, payload);
            stopEdit();
        } else {
            addTask(payload);
        }
        
        elements.form.reset();
        
        // إعادة تعيين حقول التنبيه
        elements.alertDate.value = '';
        elements.alertTime.value = '09:00';
        elements.alertEnabled.value = 'no';
    });
    
    // أزرار النموذج
    elements.cancelEdit.addEventListener('click', stopEdit);
    elements.clearForm.addEventListener('click', () => {
        elements.form.reset();
        elements.alertDate.value = '';
        elements.alertTime.value = '09:00';
        elements.alertEnabled.value = 'no';
    });
    
    // البحث والفلترة
    elements.search.addEventListener('input', renderTasks);
    
    elements.filters.addEventListener('click', (e) => {
        if (!e.target.dataset.filter) return;
        
        filter = e.target.dataset.filter;
        
        // تحديث حالة الأزرار
        Array.from(elements.filters.querySelectorAll('button')).forEach(btn => {
            btn.classList.remove('btn-accent');
            btn.classList.add('btn-muted');
        });
        
        e.target.classList.remove('btn-muted');
        e.target.classList.add('btn-accent');
        
        renderTasks();
    });
    
    // تصدير
    elements.exportExcel.addEventListener('click', exportToExcel);
    
    // استيراد
    elements.importExcelBtn.addEventListener('click', () => elements.importExcel.click());
    elements.importExcel.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            importFromExcel(e.target.files[0]);
        }
        e.target.value = '';
    });
    
    // التنبيهات
    elements.viewAlerts.addEventListener('click', () => {
        elements.alertsModal.style.display = 'flex';
        renderAlertsList();
    });
    
    elements.testAlert.addEventListener('click', testWhatsAppAlert);
    elements.saveAlerts.addEventListener('click', () => {
        alertsSettings.phoneNumber = elements.alertsPhone.value.trim();
        saveAlertsSettings();
    });
    
    // أزرار أخرى
    elements.printBtn.addEventListener('click', printSummary);
    
    elements.clearAll.addEventListener('click', () => {
        if (confirm('هل تريد حذف جميع المهام؟')) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    });
    
    // مشاركة المهام
    elements.shareWhatsApp.addEventListener('click', shareViaWhatsApp);
    elements.shareGoogle.addEventListener('click', shareViaGoogle);
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // إغلاق النوافذ المنبثقة بالنقر خارجها
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // طلب إذن الإشعارات
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// تهيئة التطبيق
function init() {
    loadTasks();
    loadAlertsSettings();
    setupEventListeners();
    renderTasks();
    startAlertsMonitoring();
    
    // تعيين تاريخ اليوم كحد أدنى لحقل تاريخ التنبيه
    const today = new Date().toISOString().split('T')[0];
    elements.alertDate.min = today;
}

// بدء التشغيل
init();