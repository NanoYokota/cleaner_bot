class SheetInfo {
  constructor( sheetName ) {
    this.sheetName = sheetName;
    this.sheet = ss.getSheetByName( sheetName );
    this.input = { rows: {}, cols: {}, ranges: {}, values: {}, };
    this.row = {
      input: {},
      last: {},
    };
    this.col = {
      input: {},
      last: {},
    };
    this.num = {
      col: {},
    };
    this.cell = {};
    this.range = {};
  }
}

class NameListSheet extends SheetInfo {
  constructor( sheetName ) {
    super( sheetName );
    this.className = "NameListSheet";
    this.member = { rows: {}, cols: {}, ranges: {}, values: {}, indexes: {}, };
    this.input.rows.label = 1;
    this.input.rows.first = 2;
    this.input.cols.first = 1;
    this.member.cols.nameInput = 1;
    this.member.cols.cwIdInput = 2;
    this.member.cols.commuteInput = 3;
    this.member.cols.flagInput = 4;
    this.member.cols.dateInput = 5;
  }

  getInputCols() {
    this.input.cols.last = this.sheet.getLastColumn();
    return this.input.cols;
  }

  getMemberRows() {
    this.member.rows.nowInput = this.sheet
      .getRange( this.input.rows.label, this.input.cols.first )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow();
    this.member.rows.numRaw = this.member.rows.nowInput - this.input.rows.label;
    return this.member.rows;
  }

  getMemberCols() {
    this.member.cols.lastInput = this.member.cols.dateInput;
    this.member.cols.num = this.member.cols.lastInput - this.input.cols.first + 1;
    return this.member.cols;
  }

  getMemberRanges() {
    const rows = this.getMemberRows();
    const cols = this.getMemberCols();
    this.member.ranges.raw = this.sheet.getRange(
      this.input.rows.first,
      this.input.cols.first,
      rows.numRaw,
      cols.num
    );
    this.getFirstMemberRange();
    return this.member.ranges;
  }

  getRawMemberRange() {
    const rows = this.getMemberRows();
    const cols = this.getMemberCols();
    this.member.ranges.raw = this.sheet.getRange(
      this.input.rows.first,
      this.input.cols.first,
      rows.numRaw,
      cols.num
    );
    return this.member.ranges.raw;
  }

  getDateRange() {
    const rows = this.getMemberRows();
    this.member.ranges.date = this.sheet.getRange(
      this.input.rows.first,
      this.member.cols.dateInput,
      rows.numRaw,
    );
    return this.member.ranges.date;
  }

  getFirstMemberRange() {
    const cols = this.getMemberCols();
    this.member.ranges.first = this.sheet.getRange(
      this.input.rows.first,
      this.input.cols.first,
      1,
      cols.num
    );
    return this.member.ranges.first;
  }

  getMemberRawValues() {
    const range = this.getMemberRanges().raw;
    this.member.values.raw = range.getValues();
    return this.member.values.raw;
  }

  getDateValues() {
    const range = this.getDateRange();
    this.member.values.date = range.getValues();
    return this.member.values.date;
  }

  getMemberIndexes( search, type = "id" ) {
    const funcName = "NameListSheet.getMemberIndex()";
    if ( !search ) {
      throw "The first argument must not be empty.";
    }
    let searchIndex;
    if ( type == "id" ) {
      searchIndex = 1;
    } else if ( type == "name" ) {
      searchIndex = 0;
    } else if ( type == "flag" ) {
      searchIndex = 3;
    } else {
      throw "Invalid argument type: " + type;
    }
    const values = this.getMemberRawValues();
    for ( let i = 0; i < values.length; i++ ) {
      const member = values[ i ];
      if ( DEBUG ) {
        console.log( `[DEBUG: ${ funcName }] member: ${ member }` );
      }
      if ( member[ searchIndex ] == search ) {
        this.member.indexes.on = i;
        this.member.indexes.next = this.nextCommuteMemberIndex( i + 1 );
        if ( DEBUG ) {
          console.log( `[DEBUG: ${ funcName }] this.member.indexes ↓` );
          console.log( this.member.indexes );
        }
        return this.member.indexes;
      }
    }
    return false;
  }

  getMember( search , type = "id", next = false ) {
    const funcName = "NameListSheet.getMember()";
    if ( !search ) {
      throw "The first argument must not be empty.";
    }
    const indexes = this.getMemberIndexes( search, type );
    if ( indexes == false ) {
      return false;
    }
    let memberIndex = indexes.on;
    if ( next ) {
      memberIndex = indexes.next;
    }
    return this.member.values.raw[ memberIndex ];
  }

  getMemberRange( search, type = "id", next = false ) {
    const funcName = "NameListSheet.getMemberRange()";
    if ( !search ) {
      throw "The first argument must not be empty.";
    }
    const indexes = this.getMemberIndexes( search, type );
    if ( indexes == false ) {
      return false;
    }
    let targetRow = indexes.on + 1 + this.input.rows.label;
    if ( next ) {
      targetRow = indexes.next;
    }
    return this.sheet.getRange(
      targetRow,
      this.input.cols.first,
      1,
      this.member.cols.num
    );
  }

  nextCommuteMemberIndex( index ) {
    const funcName = "NameListSheet.nextCommuteMemberIndex()";
    if ( index >= this.member.values.raw.length ) {
      index = 0;
    }
    if ( this.member.values.raw[ index ][ 2 ] == "なし" ) {
      return this.nextCommuteMemberIndex( index + 1 );
    } else {
      return index;
    }
  }

  getCommuteMemberNum() {
    const funcName = `${ this.className }.getCommuteMemberNum`;
    this.member.rows.numCommute = 0;
    for ( let i = 0; i < this.member.values.raw.length; i++ ) {
      const member = this.member.values.raw[ i ];
      if ( member[ 2 ] == "あり" ) {
        this.member.rows.numCommute++;
      }
    }
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] this.member.rows.numCommute: ${ this.member.rows.numCommute }` );
    }
    return this.member.rows.numCommute;
  }

  switchCleaner() {
    const funcName = `${ this.className }.switchCleaner`;
    let memberOn = this.member.values.raw[ this.member.indexes.on ];
    const rangeOn = this.sheet.getRange(
      this.member.indexes.on + 1 + this.input.rows.label,
      this.input.cols.first,
      1,
      this.member.cols.num
    );
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] rangeOn.getValues() ↓` );
      console.log( rangeOn.getValues() );
    }
    let memberNext = this.member.values.raw[ this.member.indexes.next ];
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] memberNext ↓` );
      console.log( memberNext );
    }
    const rangeNext = this.sheet.getRange(
      this.member.indexes.next + 1 + this.input.rows.label,
      this.input.cols.first,
      1,
      this.member.cols.num
    );
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] rangeNext.getValues() ↓` );
      console.log( rangeNext.getValues() );
    }
    if ( !memberNext || !rangeNext || !rangeOn || !memberOn ) {
      throw "The flag is not detected.";
    }
    memberOn[ 3 ] = "";
    memberNext[ 3 ] = "on";
    log( funcName, memberOn, { label: "memberOn", type: "info", lineTwo: true, } );
    log( funcName, memberNext, { label: "memberNext", type: "info", lineTwo: true, } );
    rangeOn.setValues( [ memberOn ] );
    rangeNext.setValues( [ memberNext ] );
    this.member.indexes.on = this.member.indexes.next;
    this.member.indexes.next++;
  }

  updateCleaningDates() {
    const funcName = `${ this.className }.updateCleaningDates`;
    const members = this.member.values.raw;
    // 担当者にセットするための日付を取得
    const dates = cleaningDates();
    // セットするように配列を組み直す
    let datesForMembers = [];
    let count = 0;
    for ( let i = this.member.indexes.on; i < members.length; i++ ) {
      if ( members[ i ][ 2 ] == "なし" ) {
        datesForMembers[ i ] = [ '' ];
      } else {
        datesForMembers[ i ] = [ dates[ count ] ];
        count++;
      }
    }
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] datesForMembers ↓` );
      console.log( datesForMembers );
      console.log( `[DEBUG: ${ funcName }] datesForMembers.length: ${ datesForMembers.length }` );
    }
    for ( let i = 0; i < this.member.indexes.on; i++ ) {
      if ( members[ i ][ 2 ] == "なし" ) {
        datesForMembers[ i ] = [ '' ];
      } else {
        datesForMembers[ i ] = [ dates[ count ] ];
        count++;
      }
    }
    log( funcName, datesForMembers, { label: "datesForMembers", type: "info", lineTwo: true, } );
    log( funcName, datesForMembers.length, { label: "datesForMembers.length", type: "info", } );
    const rangeDate = this.getDateRange();
    try {
      rangeDate.setValues( datesForMembers );
    } catch ( e ) {
      console.log( `[ERROR: ${ funcName }] ${ e }` );
    }
  }
}