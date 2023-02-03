
function sendMessageCw( message = "", roomID = roomId_test )
{
  if ( !isReleased ) {
    roomID = roomId_test;
  }
  const url = `${ CW_ENDPOINT_URL }/rooms/${ roomID }/messages`;
  let options = {
    'method' : 'POST',
    'accept' : 'application/json',
    'headers' : {
      "x-chatworktoken" : CW_API_TOKEN,
      "content-type": "application/x-www-form-urlencoded",
    },
    "muteHttpExceptions" : true,
    'payload' : {
      'body': message,
    },
  };
  let response;
  try {
    response = UrlFetchApp.fetch( url, options );
  } catch( e ) {
    response = e;
  }
  return response;
}

function contactsList()
{
  const url = `${ CW_ENDPOINT_URL }/contacts`;
  const options = {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'x-chatworktoken': CW_API_TOKEN,
    },
  };
  let response;
  try {
    response = UrlFetchApp.fetch( url, options );
  } catch( e ) {
    response = e;
  }
  if ( DEBUG ) {
    console.log( JSON.parse( response ) );
  }
  return response;
}

function roomId( accountId )
{
  const response = contactsList( accountId );
  const data = JSON.parse( response );
  for ( let i = 0; i < data.length; i++ ) {
    const contact = data[ i ];
    if ( DEBUG ) {
      console.log( contact );
    }
    if ( contact.account_id == accountId ) {
      return contact.room_id;
    }
  }
  return false;
}

function isHoliday( date )
{
  if ( isWeekend( date ) ) {
    return true;
  }
  if ( isSpecialHoliday( date ) ) {
    return true;
  }
  return false;
}

function isWeekend( date )
{
  const weekInt = date.getDay();
  if ( weekInt <= 0 || 6 <= weekInt ) {
    return true;
  }
  return false;
}

function isSpecialHoliday( date )
{
  const calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  const calendar = CalendarApp.getCalendarById( calendarId );
  const events = calendar.getEventsForDay( date );
  if ( events.length > 0 ) {
    return true;
  }
  if ( HOLIDAYS[ date.getMonth() ] ) {
    for ( let i = 0; i < HOLIDAYS[ date.getMonth() ].length; i++ ) {
      const holiday = HOLIDAYS[ date.getMonth() ][ i ];
      if ( holiday == date.getDate() ) {
        return true;
      }
    }
  }
  return false;
}

function isTodayFriday() {
  return dayToday == 5;
}

function isThisFriday( date ) {
  const diffTime = date.getTime() - todayObject.getTime();
  const diffDay = Math.floor( timestampToDate( diffTime ) );
  if ( DEBUG ) {
    log( 'isThisFriday', diffDay, { label : "diffDay" } );
  }
  if ( diffDay >= 0 && diffDay < 5 && date.getDay() == 5 ) {
    return true;
  }
  return false;
}

function cleaningDates()
{
  const funcName = "cleaningDates";
  let dates = [];
  let year = yearToday;
  let month = monthToday - 1;
  let dateStart = dateToday + 1;
  let lastDate = new Date( year, month, 0 ).getDate() + 1;
  if ( DEBUG ) {
    log( funcName, lastDate, { label: "lastDate", } );
  }
  const commuteNum = nameListSh.getCommuteMemberNum();
  while( dates.length < commuteNum ) {
    for ( let i = dateStart; i <= lastDate; i++ ) {
      const date = new Date( year, month, i );
      if ( DEBUG ) {
        log( funcName, date, { label: "date", } );
      }
      if ( isWeekend( date ) ) {
        if ( DEBUG ) {
          log( funcName, "Skip weekend." );
        }
        continue;
      }
      if ( isThisFriday( date ) ) {
        if ( DEBUG ) {
          log( funcName, "Skip this friday." );
        }
        continue;
      }
      if ( date.getDay() == 5 && !isSpecialHoliday( date ) ) {
        dates.push( date );
        log( funcName, date, { label: "Friday added", type: "info", } );
      } else if ( date.getDay() == 5 && isSpecialHoliday( date ) && i - 1 > 0 ) {
        const dateThu = new Date( year, month, i - 1 );
        if ( !isSpecialHoliday( dateThu ) ) {
          dates.push( dateThu );
          log( funcName, dateThu, { label: "Thursday added", type: "info", } );
        } else if ( i - 2 > 0 ) {
          const dataWed = new Date( year, month, i - 2 );
          if ( !isSpecialHoliday( dataWed ) ) {
            dates.push( dataWed );
            log( funcName, dataWed, { label: "Wednesday added", type: "info", } );
          } else if ( i - 3 > 0 ) {
            const dateTue = new Date( year, month, i - 3 );
            if ( !isSpecialHoliday( dateTue ) ) {
              dates.push( dateTue );
              log( funcName, dateTue, { label: "Tuesday added", type: "info", } );
            } else if ( i - 4 > 0 ) {
              const dateMon = new Date( year, month, i - 4 );
              if ( !isSpecialHoliday( dateMon ) ) {
                dates.push( dateMon );
                log( funcName, dateMon, { label: "Monday added", type: "info", } );
              }
            }
          }
        }
      }
      if ( dates.length >= commuteNum ) {
        break;
      }
    }
    month++;
    dateStart = 1;
    if ( month + 1 > 12 ) {
      year++;
      month = 1 - 1; // 1月(Dateオブジェクトに入れる数値は実際の月の-1)
    }
    lastDate = new Date( year, month, 0 );
  }
  log( funcName, dates, { label: "dates", type: "info", lineTwo: true, } );
  return dates;
}

function buildRemindMessage()
{
  const funcName = "buildRemindMessage";
  const indexes = nameListSh.member.indexes;
  const members = nameListSh.member.values.raw;
  const memberOn = members[ indexes.on ];
  if ( !memberOn ) {
    throw `[ERROR: ${ funcName }] The flag is not detected.`;
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] memberOn ↓` );
    console.log( memberOn );
  }
  // リマインドメッセージの組み立て
  let message = isReleased ? `[To:${ memberOn[ 1 ] }] ${ memberOn[ 0 ] }さん\n` : "";
  message += !isReleased ? "【テスト実行】※無視してください。\n" : "";
  message += "今日のトイレ掃除当番です。\n";
  message += "よろしくお願いします。\n";
  const week = 4;
  message += "[info][title]" + week + "週間先までの担当者[/title]\n";
  // 来週以降の担当者と日付を組み立て
  let count = 0;
  if ( DEBUG ) {
    log( funcName, indexes.on, { label: "indexes.on", } );
    log( funcName, members.length, { label: "members.length", } );
  }
  for ( let i = indexes.on + 1; count < week; i++ ) {
    if ( DEBUG ) {
      log( funcName, count, { label: "count", } );
      log( funcName, i, { label: "i", } );
    }
    if ( i + 1 >= members.length && count < week ) {
      if ( DEBUG ) log( funcName, "Recurrent." );
      i = -1;
      continue;
    }
    const member  = members[ i ];
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] member ↓` );
      console.log( member );
    }
    if ( member[ 2 ] == "なし" ) {
      continue;
    }
    const month = member[ 4 ].getMonth() + 1;
    const date = member[ 4 ].getDate();
    message += `${ month }月${ date }日：${ member[ 0 ] }さん\n`;
    count++;
  }
  message += `[/info]`;
  return message;
}

function isToday( date ) {
  const funcName = "isToday";
  if ( DEBUG ) {
    log( funcName, date.getFullYear(), { label: "date.getFullYear()", } );
    log( funcName, date.getMonth(), { label: "date.getMonth()", } );
    log( funcName, date.getDate(), { label: "date.getDate()", } );
    log( funcName, yearToday, { label: "yearToday", } );
    log( funcName, monthToday - 1, { label: "monthToday - 1", } );
    log( funcName, dateToday, { label: "dateToday", } );
  }
  if (
    date.getFullYear() == yearToday &&
    date.getMonth() == monthToday - 1 &&
    date.getDate() == dateToday
  ) {
    return true;
  }
  return false;
}

function timestampToDate( timestamp ) {
  return timestamp / ( 1000 * 60 * 60 * 24 );
}