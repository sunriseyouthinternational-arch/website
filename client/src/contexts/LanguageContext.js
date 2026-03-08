import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const translations = {
  zh: {
    // Common
    home: '首頁',
    register: '註冊',
    profile: '個人檔案',
    admin: '管理員',
    login: '登入',
    logout: '登出',
    submit: '提交',
    cancel: '取消',
    save: '保存',
    edit: '編輯',
    delete: '刪除',
    add: '添加',
    back: '返回',
    loading: '加載中...',
    success: '成功',
    error: '錯誤',
    confirm: '確認',

    // Header
    appTitle: '晨光國際少年團',
    appSubtitle: 'Sunrise Youth International',

    // Registration
    memberRegistration: '團員資料',
    applicantName: '申請人姓名',
    englishAlias: '英文名',
    gender: '性別',
    male: '男',
    female: '女',
    preferNotToSay: '不願透露',
    birthDate: '出生日期',
    familyMembers: '家庭團員',
    addFamilyMember: '添加家庭團員',
    removeFamilyMember: '移除',
    contactInfo: '聯絡方式',
    phone: '電話',
    mobile: '行動電話',
    lineId: 'Line ID',
    registerSuccess: '註冊成功！',

    // Profile
    myProfile: '我的檔案',
    memberId: '團員編號',
    qrCode: 'QR 碼',
    profilePicture: '照片',
    uploadPicture: '上傳照片',
    updateInfo: '更新資料',
    myCoursesActivities: '我的課程與活動',

    // Classes & Activities
    classes: '課程',
    activities: '活動',
    availableClasses: '可報名課程',
    registeredClasses: '已報名課程',
    availableActivities: '可報名活動',
    registeredActivities: '已報名活動',
    enroll: '報名',
    enrolled: '已報名',
    time: '時間',
    cost: '費用',
    host: '主辦人',
    hostInfo: '主辦人資訊',
    hostBio: '主辦人簡介',
    hostSpecialties: '專長',
    hostEducation: '學歷',
    hostContact: '聯絡方式',
    participants: '參與人數',
    maxParticipants: '最大人數',
    paymentReminder: '請記得於課程/活動現場繳費',
    paid: '已付款',
    unpaid: '未付款',

    // Admin
    adminPanel: '管理員控制面板',
    dashboard: '儀表板',
    memberManagement: '團員管理',
    classManagement: '課程管理',
    activityManagement: '活動管理',
    totalMembers: '總團員數',
    activeClasses: '活躍課程',
    activeActivities: '活躍活動',
    viewDetails: '查看詳情',
    addNew: '新增',
    name: '名稱',
    fullName: '姓名',
    description: '描述',
    banner: '橫幅圖片',
    status: '狀態',
    active: '活躍',
    completed: '已完成',
    cancelled: '已取消',
    enrollmentHistory: '報名歷史',
    updatePaymentStatus: '更新付款狀態',

    // Messages
    enrollmentSuccess: '報名成功！請記得於現場繳費。',
    enrollmentFailed: '報名失敗，請稍後再試。',
    classFull: '課程已滿',
    activityFull: '活動已滿',
    alreadyEnrolled: '您已經報名了',
    loginRequired: '請先登入',
    invalidCredentials: '用戶名或密碼錯誤',

    // Form validation
    required: '此欄位為必填',
    invalidFormat: '格式不正確',

    // Registration flow
    lineRegistrationRequired: '⚠️ 請先加入 LINE 官方帳號以開始註冊',
    registrationSteps: '註冊步驟',
    step1: '加入 LINE 官方帳號',
    step2: '收到註冊連結',
    step3: '點擊連結完成註冊',
    referralCode: '推薦碼 (選填)',
    referralCodePlaceholder: '輸入推薦碼',
    referralCodeHelp: '如果有人推薦您加入，請輸入他們的推薦碼',
    yourReferralCode: '您的推薦碼',
    shareReferralCode: '分享此推薦碼邀請朋友加入',
    fillInformation: '請填寫您的個人資料以完成註冊',
    accessProfileViaLine: '您可以隨時透過 LINE 官方帳號選單中的「登入」按鈕來存取您的個人檔案。',
    applicantInfo: '申請人資料',
    completeRegistration: '完成註冊',

    // Profile editing
    editProfile: '編輯資料',
    editProfileTitle: '編輯個人資料',
    saving: '儲存中...',
    updateSuccess: '更新成功',
    updateFailed: '更新失敗',
    addFamilyMemberButton: '+ 新增家庭成員',
    remove: '移除',
    enterMemberId: '請輸入團員編號',
    loadSuccess: '載入成功',
    search: '查詢',
    noEnrolledClasses: '尚無報名課程',
    noEnrolledActivities: '尚無報名活動',

    // Admin
    adminPanelTitle: '請登入以訪問管理員控制面板',
    username: '用戶名',
    password: '密碼',
    classAddSuccess: '課程添加成功',
    activityAddSuccess: '活動添加成功',
    paymentStatusUpdated: '付款狀態已更新',
    enrolledCount: '已報名數',
    registeredDate: '註冊日期',
    exampleTime: '例如：每週六 10:00-12:00',
    referralLeaderboard: '推薦排行榜',
    referrals: '推薦人數',
    noReferrals: '目前沒有推薦記錄',
    rank: '排名',

    // Class system
    classInformation: '課程資訊',
    hostClasses: '開課管理',
    location: '地點',
    mapPreview: '地圖預覽',
    locationMap: '地點地圖',
    max: '最多',
    classInfoAddSuccess: '課程資訊添加成功',
    addClassInfo: '添加課程資訊',
    classInfo: '課程資訊',
    hostClass: '開課',
    day: '星期',
    classDate: '課程日期',
    selectDate: '選擇日期',
    processing: '處理中...',

    // Filters
    all: '全部',
    filterByClass: '按課程篩選',
    filterByDate: '按日期篩選',
    selectFromCalendar: '從日曆選擇',
    allClasses: '所有課程',

    // Status values
    upcoming: '即將開始',
    inPerson: '現場',
    zoom: '線上',
    memberProfile: '成員檔案',
    bannerPreview: '橫幅預覽',
    teacherPreview: '教師預覽',
    formPreview: '表單預覽',
    qrCodeImage: 'QR碼',
    noDescription: '無描述',
    noData: '無',

    // Membership status
    associationFriend: '會友',
    associationMember: '協會會員',
    boardOfDirectors: '董事會',

    // Admin dashboard
    classesAndActivities: '課程與活動',
    hostManagement: '主辦人管理',
    couponManagement: '優惠券管理',
    associationManagement: '協會管理',
    zoomUrl: 'Zoom連結',
    zoomUrlPlaceholder: 'https://zoom.us/j/123456789',
    defaultLoginCredentials: '預設用戶名: admin, 密碼: admin123'
  },
  en: {
    // Common
    home: 'Home',
    register: 'Register',
    profile: 'Profile',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    back: 'Back',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',

    // Header
    appTitle: 'Sunrise Youth International',
    appSubtitle: '晨光國際少年團',

    // Registration
    memberRegistration: 'Member Registration',
    applicantName: 'Applicant Name',
    englishAlias: 'English Name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    preferNotToSay: 'Prefer not to say',
    birthDate: 'Birth Date',
    familyMembers: 'Family Members',
    addFamilyMember: 'Add Family Member',
    removeFamilyMember: 'Remove',
    contactInfo: 'Contact Information',
    phone: 'Phone',
    mobile: 'Mobile',
    lineId: 'Line ID',
    registerSuccess: 'Registration successful!',

    // Profile
    myProfile: 'My Profile',
    memberId: 'Member ID',
    qrCode: 'QR Code',
    profilePicture: 'Profile Picture',
    uploadPicture: 'Upload Picture',
    updateInfo: 'Update Information',
    myCoursesActivities: 'My Classes & Activities',

    // Classes & Activities
    classes: 'Classes',
    activities: 'Activities',
    availableClasses: 'Available Classes',
    registeredClasses: 'Registered Classes',
    availableActivities: 'Available Activities',
    registeredActivities: 'Registered Activities',
    enroll: 'Enroll',
    enrolled: 'Enrolled',
    time: 'Time',
    cost: 'Cost',
    host: 'Host',
    hostInfo: 'Host Information',
    hostBio: 'Biography',
    hostSpecialties: 'Specialties',
    hostEducation: 'Education',
    hostContact: 'Contact',
    participants: 'Participants',
    maxParticipants: 'Max Participants',
    paymentReminder: 'Please remember to pay at the venue',
    paid: 'Paid',
    unpaid: 'Unpaid',

    // Admin
    adminPanel: 'Admin Control Panel',
    dashboard: 'Dashboard',
    memberManagement: 'Member Management',
    classManagement: 'Class Management',
    activityManagement: 'Activity Management',
    totalMembers: 'Total Members',
    activeClasses: 'Active Classes',
    activeActivities: 'Active Activities',
    viewDetails: 'View Details',
    addNew: 'Add New',
    name: 'Name',
    fullName: 'Full Name',
    description: 'Description',
    banner: 'Banner Image',
    status: 'Status',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    enrollmentHistory: 'Enrollment History',
    updatePaymentStatus: 'Update Payment Status',

    // Messages
    enrollmentSuccess: 'Enrollment successful! Please remember to pay at the venue.',
    enrollmentFailed: 'Enrollment failed. Please try again.',
    classFull: 'Class is full',
    activityFull: 'Activity is full',
    alreadyEnrolled: 'You are already enrolled',
    loginRequired: 'Please login first',
    invalidCredentials: 'Invalid username or password',

    // Form validation
    required: 'This field is required',
    invalidFormat: 'Invalid format',

    // Registration flow
    lineRegistrationRequired: '⚠️ Please add our LINE Official Account first to start registration',
    registrationSteps: 'Registration Steps',
    step1: 'Add LINE Official Account',
    step2: 'Receive registration link',
    step3: 'Click link to complete registration',
    referralCode: 'Referral Code (Optional)',
    referralCodePlaceholder: 'Enter referral code',
    referralCodeHelp: 'If someone referred you, please enter their referral code',
    yourReferralCode: 'Your Referral Code',
    shareReferralCode: 'Share this code to invite friends',
    fillInformation: 'Please fill in your information to complete registration',
    accessProfileViaLine: 'You can access your profile anytime using the "Login" button in the LINE Official Account menu.',
    applicantInfo: 'Applicant Information',
    completeRegistration: 'Complete Registration',

    // Profile editing
    editProfile: 'Edit Profile',
    editProfileTitle: 'Edit Profile',
    saving: 'Saving...',
    updateSuccess: 'Update successful',
    updateFailed: 'Update failed',
    addFamilyMemberButton: '+ Add Family Member',
    remove: 'Remove',
    enterMemberId: 'Please enter member ID',
    loadSuccess: 'Loaded successfully',
    search: 'Search',
    noEnrolledClasses: 'No enrolled classes',
    noEnrolledActivities: 'No enrolled activities',

    // Admin
    adminPanelTitle: 'Please login to access admin control panel',
    username: 'Username',
    password: 'Password',
    classAddSuccess: 'Class added successfully',
    activityAddSuccess: 'Activity added successfully',
    paymentStatusUpdated: 'Payment status updated',
    enrolledCount: 'Enrollments',
    registeredDate: 'Registered Date',
    exampleTime: 'e.g., Every Saturday 10:00-12:00',
    referralLeaderboard: 'Referral Leaderboard',
    referrals: 'Referrals',
    noReferrals: 'No referrals yet',
    rank: 'Rank',

    // Class system
    classInformation: 'Class Information',
    hostClasses: 'Host Classes',
    location: 'Location',
    mapPreview: 'Map Preview',
    locationMap: 'Location Map',
    max: 'Max',
    classInfoAddSuccess: 'Class info added successfully',
    addClassInfo: 'Add Class Info',
    classInfo: 'Class Info',
    hostClass: 'Host Class',
    day: 'Day',
    classDate: 'Class Date',
    selectDate: 'Select Date',
    processing: 'Processing...',

    // Filters
    all: 'All',
    filterByClass: 'Filter by Class',
    filterByDate: 'Filter by Date',
    selectFromCalendar: 'Select from Calendar',
    allClasses: 'All Classes',

    // Status values
    upcoming: 'Upcoming',
    inPerson: 'In-person',
    zoom: 'Zoom',
    memberProfile: 'Member Profile',
    bannerPreview: 'Banner Preview',
    teacherPreview: 'Teacher Preview',
    formPreview: 'Form Preview',
    qrCodeImage: 'QR Code',
    noDescription: 'No description',
    noData: 'N/A',

    // Membership status
    associationFriend: 'Association Friend',
    associationMember: 'Association Member',
    boardOfDirectors: 'Board of Directors',

    // Admin dashboard
    classesAndActivities: 'Classes & Activities',
    hostManagement: 'Host Management',
    couponManagement: 'Coupon Management',
    associationManagement: 'Association Management',
    zoomUrl: 'Zoom URL',
    zoomUrlPlaceholder: 'https://zoom.us/j/123456789',
    defaultLoginCredentials: 'Default username: admin, password: admin123'
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('zh'); // Default to Chinese

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
