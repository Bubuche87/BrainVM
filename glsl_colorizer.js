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
    "if",
    "else",
    "subroutine",
    "uniform",
    "buffer",
    "layout",
    "break",
    "continue",
    "do",
    "for",
    "while",
    "true",
    "false",
    "invariant",
    "discard",
    "return",
    "struct",
    "switch",
    "case",
    "default",

    "in",
    "out",
    "inout",
    "flat",
    "precision",
    "lowp",
    "mediump",
    "highp",
    "attribute",
    "const",
    "varying",
    "smooth",
    "shared"
  ] ),
  standard: new Set( [
    "gl_Position",
    "texelFetch",
    "textureSize",
    "abs",
    "clamp",
    "atan",
    "acos",
    "normalize"
  ] ),
  type: new Set( [
    "centroid",
    "patch",
    "sample",
    "double",
    "precise",
    "dmat2",
    "dmat3",
    "dmat4",
    "mat2x2",
    "mat2x3",
    "mat2x4",
    "dmat2x2",
    "dmat2x3",
    "dmat2x4",
    "mat3x2",
    "mat3x3",
    "mat3x4",
    "dmat3x2",
    "dmat3x3",
    "dmat3x4",
    "mat4x2",
    "mat4x3",
    "mat4x4",
    "dmat4x2",
    "dmat4x3",
    "dmat4x4",
    "dvec2",
    "dvec3",
    "dvec4",
    "uint",
    "uvec2",
    "uvec3",
    "uvec4",
    "image1D",
    "iimage1D",
    "uimage1D",
    "image2D",
    "iimage2D",
    "uimage2D",
    "image3D",
    "iimage3D",
    "uimage3D",
    "image2DRect",
    "iimage2DRect",
    "uimage2DRect",
    "imageCube",
    "iimageCube",
    "uimageCube",
    "imageBuffer",
    "iimageBuffer",
    "uimageBuffer",
    "image1DArray",
    "iimage1DArray",
    "uimage1DArray",
    "image2DArray",
    "iimage2DArray",
    "uimage2DArray",
    "imageCubeArray",
    "iimageCubeArray",
    "uimageCubeArray",
    "image2DMS",
    "iimage2DMS",
    "uimage2DMS",
    "image2DMSArray",
    "iimage2DMSArray",
    "uimage2DMSArray",


    "coherent",
    "volatile",
    "restrict",
    "readonly",
    "writeonly",
    "atomic_uint",
    "noperspective",
    "int",
    "float",
    "void",
    "bool",
    "mat2",
    "mat3",
    "mat4",
    "vec2",
    "vec3",
    "vec4",
    "ivec2",
    "ivec3",
    "ivec4",
    "bvec2",
    "bvec3",
    "bvec4",
    "sampler1D",
    "sampler2D",
    "sampler3D",
    "samplerCube",
    "sampler1DShadow",
    "sampler2DShadow",
    "samplerCubeShadow",
    "sampler1DArray",
    "sampler2DArray",
    "sampler1DArrayShadow",
    "sampler2DArrayShadow",
    "isampler1D",
    "isampler2D",
    "isampler3D",
    "isamplerCube",
    "isampler1DArray",
    "isampler2DArray",
    "usampler1D",
    "usampler2D",
    "usampler3D",
    "usamplerCube",
    "usampler1DArray",
    "usampler2DArray",
    "sampler2DRect",
    "sampler2DRectShadow",
    "isampler2DRect",
    "usampler2DRect",
    "samplerBuffer",
    "isamplerBuffer",
    "usamplerBuffer",
    "sampler2DMS",
    "isampler2DMS",
    "usampler2DMS",
    "sampler2DMSArray",
    "isampler2DMSArray",
    "usampler2DMSArray",
    "samplerCubeArray",
    "samplerCubeArrayShadow",
    "isamplerCubeArray",
    "usamplerCubeArray"
  ] ),
  reserved: new Set( [
    "common",
    "partition",
    "active",
    "asm",
    "class",
    "union",
    "enum",
    "typedef",
    "template",
    "this",
    "resource",
    "goto",
    "inline",
    "noinline",
    "public",
    "static",
    "extern",
    "external",
    "interface",
    "long",
    "short",
    "half",
    "fixed",
    "unsigned",
    "superp",
    "input",
    "output",
    "hvec2",
    "hvec3",
    "hvec4",
    "fvec2",
    "fvec3",
    "fvec4",
    "sampler3DRect",
    "filter",
    "sizeof",
    "cast",
    "namespace",
    "using"
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
          if ( c == '#' )
          {
            state = 60;
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
        case 60:
          if ( c == '\n' )
            return validate("preprocessor");
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

function glsl_colorize( source )
{
  if ( typeof(source) != 'string' )
    throw new Error("Illegal parameter: must be a string");

  var worder = create_worder( source );
  var words = [];

  var max = 1000;
  var word;
  while( (word = worder.next()) != null )
  {
    max--;
    if ( max == 0 )
      break;
    words.push( word );
  }

  var groups = do_groups( words );

  var res = document.createElement("pre");
  res.className = "glsl";

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
