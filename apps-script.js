// Google Apps Script - Book Tracker API
// Deploy as Web App: Extensions → Apps Script → Deploy → New deployment → Web app
// Set "Who has access" to "Anyone"
//
// On first run, this script creates a Google Sheet called "Book Tracker Data"
// and stores its ID in script properties. You can find the sheet in your Google Drive.

const SHEET_NAME = 'BookTracker';

function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SHEET_ID');
  
  if (!ssId) {
    const ss = SpreadsheetApp.create('Book Tracker Data');
    ssId = ss.getId();
    props.setProperty('SHEET_ID', ssId);
    
    const sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
    sheet.appendRow(['key', 'value']);
  }
  
  return SpreadsheetApp.openById(ssId);
}

function getSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['key', 'value']);
  }
  return sheet;
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getBooks') {
    return getBooks();
  }
  if (action === 'getDailyLog') {
    return getDailyLog();
  }
  
  return jsonResponse({ error: 'Unknown action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'saveBooks') {
    return saveBooks(data.books);
  }
  if (action === 'saveDailyLog') {
    return saveDailyLog(data.log);
  }
  if (action === 'addBook') {
    return addBook(data.book);
  }
  if (action === 'deleteBook') {
    return deleteBook(data.id);
  }
  if (action === 'updateProgress') {
    return updateProgress(data.id, data.completed);
  }
  
  return jsonResponse({ error: 'Unknown action' });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getBooks() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let booksJson = null;
  let logJson = null;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'books') booksJson = data[i][1];
    if (data[i][0] === 'dailyLog') logJson = data[i][1];
  }
  
  return jsonResponse({
    books: booksJson ? JSON.parse(booksJson) : [],
    dailyLog: logJson ? JSON.parse(logJson) : {}
  });
}

function saveBooks(books) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'books') {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(books));
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow(['books', JSON.stringify(books)]);
  }
  
  return jsonResponse({ success: true });
}

function getDailyLog() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'dailyLog') {
      return jsonResponse({ log: JSON.parse(data[i][1]) });
    }
  }
  
  return jsonResponse({ log: {} });
}

function saveDailyLog(log) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'dailyLog') {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(log));
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow(['dailyLog', JSON.stringify(log)]);
  }
  
  return jsonResponse({ success: true });
}

function addBook(book) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let books = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'books') {
      books = JSON.parse(data[i][1]);
      break;
    }
  }
  
  books.push(book);
  
  saveBooks(books);
  return jsonResponse({ success: true });
}

function deleteBook(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let books = [];
  let log = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'books') books = JSON.parse(data[i][1]);
    if (data[i][0] === 'dailyLog') log = JSON.parse(data[i][1]);
  }
  
  books = books.filter(b => b.id !== id);
  Object.keys(log).forEach(key => {
    if (key.startsWith(id + '-')) delete log[key];
  });
  
  saveBooks(books);
  saveDailyLog(log);
  return jsonResponse({ success: true });
}

function updateProgress(id, completed) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let books = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'books') {
      books = JSON.parse(data[i][1]);
      break;
    }
  }
  
  const book = books.find(b => b.id === id);
  if (book) {
    book.completed = Math.min(completed, book.total);
    saveBooks(books);
  }
  
  return jsonResponse({ success: true });
}
