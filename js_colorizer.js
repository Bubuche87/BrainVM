(function() {

var white_spaces = new Set( " \t\n".split("") );
var digit = new Set( "0123456789".split("") );
var hexa = new Set( "0123456789abcdefABCEDF".split("") );
var octal = new Set( "01234567" );
var id_part = new Set( "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$".split("") );
var operators = new Set( "&~{([-|^)]=}+<>,?;.:/!^%*".split("") );

var separators = new Set();
white_spaces.forEach( (x) => separators.add(x) );
operators.forEach( (x) => separators.add(x) );

var special_words = {
  control_flow: new Set( [
    "break",
    "case",
    "catch",
    "continue",
    "debugger",
    "do",
    "else",
    "finally",
    "for",
    "if",
    "return",
    "switch",
    "throw",
    "try",
    "while",
    "with"
  ] ),
  keyword: new Set( [
    "const",
    "delete",
    "false",
    "function",
    "in",
    "Infinity",
    "instanceof",
    "NaN",
    "new",
    "null",
    "this",
    "true",
    "typeof",
    "undefined",
    "var",
    "void"
  ] ),
  module: new Set( [
    "as",
    "default",
    "export",
    "from",
    "import",
    "package",
  ] ),
  reserved: new Set( [
    "class",
    "enum",
    "extends",
    "implements",
    "interface",
    "let",
    "private",
    "protected",
    "public",
    "static",
    "super",
    "yield"
  ] )
};

function word_type( word )
{
  for ( k in special_words )
    if ( special_words[k].has( word ) )
      return k;
  return "id";
}

var create_worder = function ( source )
{
  var res = {};
  res.source = source;
  res.cursor = 0;
  var word = [];
  var c;

  function validate( t )
  {
    var res = { type: t, value: word.join("") };
    word = [];
    return res;
  }


  function forward() { res.cursor++; if ( c ) word.push( c ); }
  function backward() { res.cursor--; if ( c ) word.pop( ); }

  var len = source.length;
  res.next = function()
  {
    if ( res.cursor >= len )
      return null;
    word = [];
    var state = 0;
    var string_start = null;

    while ( res.cursor <= len )
    {
      c = source.charAt(res.cursor);
      forward();

      switch( state )
      {
        case 0:
          if ( ! c ) return null;

          if ( c == '/' )
          {
            state = 50;
            continue;
          }
          if ( c == "." ) // special case ".56" form
          {
            state = 16;
            continue;
          }
          if ( white_spaces.has(c) )
          {
            state = 40;
            continue;
          }
          if ( c == "0" )
          {
            state = 11;
            continue;
          }
          if ( digit.has(c) )
          {
            state = 10;
            continue;
          }
          if ( id_part.has(c) )
          {
            state = 20;
            continue;
          }
          if ( operators.has(c) )
          {
            return validate("operator");
          }
          if ( c == '"' || c == "'" || c == "`" )
          {
            state = 30;
            string_start = c;
            continue;
          }
          break;
        case 10: // reading number
          if ( digit.has(c) )
            continue;

          if ( c == "." )
          {
            state = 14;
            continue;
          }
          if ( separators.has(c) || ! c )
          {
            backward();
            return validate("integer");
          }
          break;
        case 11: // started with 0: hexa, octal or decimal ... or just zero?
          if ( c == "x" )
          {
            state = 12;
            continue;
          }
          else if ( octal.has(c) )
          {
            state = 13;
            continue;
          }
          else if ( c == "." )
          {
            state = 14;
            continue;
          }
          else if ( separators.has(c) || ! c )
          {
            backward();
            return validate( "integer" );
          }
          break;
        case 12: // reading hexa (begin)
          if ( hexa.has(c) )
          {
            state = 15;
            continue;
          }
          break;
        case 13:
          if ( octal.has(c) )
            continue;
          if ( separators.has(c) || ! c )
          {
            backward();
            return validate("octal");
          }
          break;
        case 14: // reading real
          if ( digit.has(c) )
            continue;
          if ( separators.has(c) || ! c )
          {
            backward();
            return validate("real");
          }
          break;
        case 15: // reading hexa (continuation)
          if ( hexa.has(c) )
            continue;

          if ( separators.has(c) || ! c )
          {
            backward();
            return validate("hexa");
          }
          break;
        case 16: // read ".", for the special form ".56". Or it's just an operator.
          if ( digit.has(c) )
          {
            state = 14;
            continue;
          }
          else
          {
            backward();
            return validate("operator");
          }
          break;
        case 20:
          if ( id_part.has(c) || digit.has(c) )
          {
            continue;
          }
          else
          {
            backward();
            var tmp = validate( "<>" );
            tmp.type = word_type( tmp.value );
            return tmp;
          }
        case 30:
          if ( c == string_start || c == "\n" || ! c )
          {
            return validate("string");
          }
          if ( c == '\\' )
          {
            state = 31;
            continue;
          }
          continue;
        case 31:
          state = 30;
          continue;
        case 40:
          if ( white_spaces.has(c) )
            continue;
          backward();
          return validate("white");
        case 50: // read "/". Division or comment (or regexp, but screw it) ?
          if ( c == "/" )
          {
            state = 51;
            continue;
          }
          if ( c == "*" )
          {
            state = 52;
            continue;
          }
          else
          {
            backward();
            return validate("operator");
          }
        case 51:
          if ( c == '\n' || ! c )
            return validate("single-line-comment");
          continue;
        case 52:
          if ( ! c )
            return validate("multi-line-comment");

          if ( c == '*' )
            state = 53;
          continue;
        case 53:
          if ( ! c )
            return validate("multi-line-comment");

          if ( c == '/' )
            return validate("multi-line-comment");
          else
            state = 52;
          continue;


      }

      return validate("unknown");
    }
    return validate("unused");
  }

  return res;
}

function do_groups( words )
{
  var res = [];
  var current_type = null;
  var current_group = null;

  for ( var i = 0; i < words.length; i++ )
  {
    var word = words[i];
    if ( current_type == null && word.type == "white" )
      continue;

    if ( i == words.length-1 && word.type == "white" )
      break;

    if ( word.type != current_type && (word.type != "white") )
    {
      current_group = { type: word.type, values: [] };
      current_type = word.type;
      res.push( current_group );
    }

    current_group.values.push(word.value);
  }

  return res;
}

js_colorize = function( source )
{
  var worder = create_worder( source );
  var words = [];

  var word;
  while( (word = worder.next()) != null )
    words.push( word );

  var groups = do_groups( words );

  var res = document.createElement("pre");
  res.className = "javascript";

  for ( var i = 0; i < groups.length; i++ )
  {
    var group = groups[i];

    var sub = document.createElement("span");
    sub.className = group.type;
    sub.textContent = group.values.join("");
    res.appendChild(sub);
  }

  return res;
}
})();
