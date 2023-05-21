/*
 * @author Costin S modified and ported to C by Bubuche
 *
 * Re-modified to fix a bug in T_tree_get_nth (that never worked then ?)
 * Then re-modified and re-ported to JavaScript, because why not ?
*/


/*typedef void T;

typedef struct
{
  size_t size;
  unsigned char payload[];
} sized_payload;

typedef struct T_node
{
  struct T_node * left;
  struct T_node * right;
  signed int balance:5;
  signed int hasSize:1;

  unsigned char payload[]; // extensible structure
} T_node;

#define SIZED(n) ( (sized_payload*) n->payload )

*/

/* static */ var T_node_value = function(n)
{
  return n.payload;
}

/* static */ var T_node_size = function(n)
{
  if ( n == null )
    return 0;

  return n.size;
}

/*
typedef struct T_tree
{
  int (*comparator) ( const void * A, const void * B );
  size_t T_size;

  unsigned int wasDone:1;
  unsigned int wasSuccessful:1;
  unsigned int hasSize:1;

  size_t size;
  T_node * root;

  void (*freer) (void *, void *);
  void * userData;
} T_tree;
*/

var create_T_tree = function( comparator )
{
  var res = {};

  res.comparator = comparator;
  res.size = 0;
  res.root = null;
  res.freer = null;
  res.userData = null;

  res.wasDone = null;
  res.wasSuccessful = null;
  res.hasSize = false;

  return res;
}

var eve_create_T_tree_with_size = function( comparator )
{
  var res = eve_create_T_tree( comparator );
  res.hasSize = true;

  return res;
}

/* static */ var T_node_free_element = function(tree, node)
{
  if ( tree.freer == null )
    return;

  tree.freer(T_node_value(node), tree.userData);
}

/* static */ var T_node_destroy = function( tree, node )
{
  if ( node == null ) return;
  T_node_free_element( tree, node );
  T_node_destroy( tree, node.left );
  T_node_destroy( tree, node.right );
}

var T_tree_destroy = function( tree )
{
  T_node_destroy(tree, tree.root);
}

var T_tree_clear = function( tree )
{
  T_node_destroy(tree, tree.root);
  tree.size = 0;
  tree.root = null;
}

var T_tree_size = function( tree )
{
  return tree.size;
}

var T_tree_is_empty = function( tree )
{
  return tree.size == 0;
}

/* static */ var create_T_node = function( element, hasSize )
{
  var res = {
    left: null,
    right: null,
    balance: 0,
    hasSize: hasSize,
    payload: null
  };

  if ( hasSize )
    res.size = 1;

  // ARGH, should be a COPY of the node
  res.payload = element;

  return res;
}

//static T_node * T_node_add(T_tree * tree, T_node * elem_ptr, T * data);
//static T_node * T_node_delete(T_tree * tree, T_node * node_ptr, const T * arg);

var T_tree_add = function( tree, element )
{
  //assert( element != null );
  tree.wasDone = 0;
  tree.wasSuccessful = 0;
  tree.root = T_node_add(tree, tree.root, element);
  if ( tree.wasSuccessful ) tree.size++;
}

var T_tree_delete = function( tree, element )
{
  //assert( element != NULL );
  if ( tree.size == 0 )
    return;

  tree.wasDone = 0;
  tree.wasSuccessful = 0;
  tree.root = T_node_delete(tree, tree.root, element);
  if ( tree.wasSuccessful ) tree.size--;
}

var T_tree_get_same = function( tree, element )
{
  //assert( element != null );
  var current = tree.root;

  while(current != null)
  {
    var cmp = tree.comparator( element, T_node_value(current) );
    if ( cmp == 0 )
      return T_node_value(current);

    if ( cmp < 0 ) current = current.left;
    else           current = current.right;
  }

  return null;
}


var T_tree_contains = function( tree, element )
{
  //assert( element != NULL );
  return T_tree_get_same( tree, element ) != null;
}

/* static */ var T_node_on_all = function( node, consumer )
{
  if ( node == null ) return;

  T_node_on_all(node.left, consumer);
  consumer( T_node_value(node) );
  T_node_on_all(node.right, consumer);
}

var T_tree_on_all = function( tree, consumer )
{
  T_node_on_all(tree.root, consumer);
}

/* static */ var T_node_RotateLeft = function( node )
{

  var right = node.right;
  var rightLeft = right.left;

  node.right = rightLeft;
  right.left = node;

  if ( node.hasSize )
  {
    right.size = node.size;
    node.size = T_node_size(node.left) + T_node_size(node.right) + 1;
  }

  return right;
}

/* static */ var T_node_RotateRight = function( node )
{
  var left = node.left;
  var leftRight = left.right;

  node.left = leftRight;
  left.right = node;

  if ( node.hasSize )
  {
    left.size = node.size;
    node.size = T_node_size(node.left) + T_node_size(node.right) + 1;
  }

  return left;
}

var T_tree_get_min = function(tree)
{
  //assert( tree->root != NULL );

  if ( tree.root == null )
    return;

  var node = tree.root;
  while(node.left != null)
    node = node.left;

  return T_node_value(node);
}

var T_tree_get_max = function( tree )
{
  //assert( tree->root != NULL );

  if ( tree.root == null )
    return;

  var node = tree.root;
  while(node.right != null)
    node = node.right;

  return T_node_value(node);
}

/* static */ var T_node_find_min = function( node )
{
  while (node != null && node.left != null)
    node = node.left;

  return node;
}

/* static */ var T_node_add = function( tree, elem, arg )
{
  if (elem == null)
  {
    elem = create_T_node(arg, tree.hasSize);
    tree.wasDone = true;
    tree.wasSuccessful = true;
  }
  else
  {
    var resultCompare = tree.comparator(arg, T_node_value(elem) );

    if (resultCompare < 0)
    {
      var newLeft = T_node_add(tree, elem.left, arg);
      if (elem.left != newLeft)
        elem.left = newLeft;
      if ( tree.wasSuccessful && tree.hasSize )
        elem.size += 1;


      if (tree.wasDone)
      {
        elem.balance -= 1;

        if (elem.balance == 0)
          tree.wasDone = false;
        else if (elem.balance == -2)
        {
          var leftBalance = newLeft.balance;
          if (leftBalance == 1)
          {
            var elemLeftRightBalance = newLeft.right.balance;

            elem.left = T_node_RotateLeft(newLeft);
            elem = T_node_RotateRight(elem);

            elem.balance = 0;
            elem.left.balance = elemLeftRightBalance == 1 ? -1 : 0;
            elem.right.balance = elemLeftRightBalance == -1 ? 1 : 0;
          }
          else if (leftBalance == -1)
          {
            elem = T_node_RotateRight(elem);
            elem.balance = 0;
            elem.right.balance = 0;
          }

          tree.wasDone = 0;
        }
      }
    }
    else if (resultCompare > 0)
    {
      var newRight = T_node_add(tree, elem.right, arg);
      if (elem.right != newRight)
          elem.right = newRight;
      if ( tree.wasSuccessful && tree.hasSize )
        elem.size += 1;


      if (tree.wasDone)
      {
        elem.balance += 1;
        if (elem.balance == 0)
          tree.wasDone = false;
        else if (elem.balance == 2)
        {
          var rightBalance = newRight.balance;
          if (rightBalance == -1)
          {
            var elemRightLeftBalance = newRight.left.balance;

            elem.right = T_node_RotateRight(newRight);
            elem = T_node_RotateLeft(elem);

            elem.balance = 0;
            elem.left.balance = elemRightLeftBalance == 1 ? -1 : 0;
            elem.right.balance = elemRightLeftBalance == -1 ? 1 : 0;
          }
          else if (rightBalance == 1)
          {
            elem = T_node_RotateLeft(elem);

            elem.balance = 0;
            elem.left.balance = 0;
          }

          tree.wasDone = false;
        }
      }
    }
  }

  return elem;
}

/* static */ var T_node_delete = function( tree, node, arg )
{
  var cmp = tree.comparator(arg, T_node_value(node));
  var newChild = null;

  if (cmp < 0)
  {
    if (node.left != null)
    {
      newChild = T_node_delete(tree, node.left, arg);
      if (node.left != newChild)
        node.left = newChild;

      if (tree.wasDone)
        node.balance += 1;
    }
  }
  else if (cmp == 0)
  {
    tree.wasDone = true;
    if (node.left != null && node.right != null)
    {
      min = T_node_find_min(node.right);

      var swap = min.payload;
      min.payload = node.payload;
      node.payload = swap;

      tree.wasDone = false;

      newChild = T_node_delete(tree, node.right, min.payload);
      if (node.right != newChild)
        node.right = newChild;

      if (tree.wasDone)
        node.balance -= 1;
    }
    else if (node.left == null)
    {
      tree.wasSuccessful = 1;
      var result = node.right;

      T_node_free_element(tree, node);
      //free(node);
      return result;
    }
    else
    {
      tree.wasSuccessful = 1;
      var result = node.left;

      T_node_free_element(tree, node);
      //free(node);
      return result;
    }
  }
  else
  {
    if (node.right != null)
    {
      newChild = T_node_delete(tree, node.right, arg);
      if (node.right != newChild)
        node.right = newChild;

      if (tree.wasDone)
        node.balance -= 1;
    }
  }

  if (tree.wasDone)
  {
    if (node.balance == 1 || node.balance == -1)
      tree.wasDone = false;
    else if (node.balance == -2)
    {
      var nodeLeft = node.left;
      var leftBalance = nodeLeft.balance;

      if (leftBalance == 1)
      {
        var leftRightBalance = nodeLeft.right.balance;

        node.left = T_node_RotateLeft(nodeLeft);
        node = T_node_RotateRight(node);

        node.balance = 0;
        node.left.balance = (leftRightBalance == 1) ? -1 : 0;
        node.right.balance = (leftRightBalance == -1) ? 1 : 0;
      }
      else if (leftBalance == -1)
      {
        node = T_node_RotateRight(node);
        node.balance = 0;
        node.right.balance = 0;
      }
      else if (leftBalance == 0)
      {
        node = T_node_RotateRight(node);
        node.balance = 1;
        node.right.balance = -1;

        tree.wasDone = 0;
      }
    }
    else if (node.balance == 2)
    {
      var nodeRight = node.right;
      var rightBalance = nodeRight.balance;

      if (rightBalance == -1)
      {
        var rightLeftBalance = nodeRight.left.balance;

        node.right = T_node_RotateRight(nodeRight);
        node = T_node_RotateLeft(node);

        node.balance = 0;
        node.left.balance = (rightLeftBalance == 1) ? -1 : 0;
        node.right.balance = (rightLeftBalance == -1) ? 1 : 0;
      }
      else if (rightBalance == 1)
      {
        node = T_node_RotateLeft(node);
        node.balance = 0;
        node.left.balance = 0;
      }
      else if (rightBalance == 0)
      {
        node = T_node_RotateLeft(node);
        node.balance = -1;
        node.left.balance = 1;

        tree.wasDone = false;
      }
    }
  }

  if ( tree.wasSuccessful && node.hasSize )
    node.size--;

  return node;
}























/*

static int T_node_check_size(T_node * node)
{
  if ( node == NULL )
    return 0;

  int rightSize = T_node_check_size(node->right);
  int leftSize = T_node_check_size(node->left);

  int size = rightSize + leftSize + 1;
  if ( SIZED(node)->size != size )
    printf("size %d vs %d\n", SIZED(node)->size, size);
  return size;
}

static int T_node_check_balance(T_node * node)
{
  if ( node == NULL )
    return 0;

  int rightHeight = T_node_check_balance(node->right);
  int leftHeight = T_node_check_balance(node->left);

  int balance = rightHeight - leftHeight;
  if ( balance != node->balance )
    printf("balance %d vs %d\n", balance, node->balance);

  int h = 1;
  if ( rightHeight > leftHeight )
    h += rightHeight;
  else
    h += leftHeight;

  return h;
}

void T_tree_check(T_tree * tree)
{
  T_node_check_size(tree->root);
  T_node_check_balance(tree->root);
  printf("T_tree_check done\n");
}

EVEAPI void T_tree_check_balance(T_tree * tree)
{
  T_node_check_balance(tree->root);
}
*/


var T_tree_set_freer = function(tree, freer, userData)
{
  tree.freer = freer;
  tree.userData = userData;
}

/* static */ var T_tree_iterator_node = function( it )
{
  var res = it.tree.root;
  if ( res == null )
    return null;

  if ( it.nb_steps == -1 )
    return null;

  var i;
  for ( i = 0; (i < it.nb_steps) && (res != null); i++ )
  {
    if ( (it.path & (1 << i)) == 0 )
      res = res.left;
    else
      res = res.right;
  }

  //assert(res != NULL);

  return res;
}

/* static */ var T_tree_iterator_push = function( it, right )
{
  if ( right )
  {
    // set bit to 1
    it.path |= 1 << it.nb_steps;
  }
  else
  {
    // set bit to 0
    it.path &= ~ ( 1 << it.nb_steps );
  }
  it.nb_steps += 1;
}

/* static */ var T_tree_iterator_pop = function( it )
{
  it.nb_steps -= 1;
}

/* static */ var T_tree_iterator_get = function( it )
{
  return (it.path & (1 << (it.nb_steps-1))) != 0;
}

/* static */ var T_tree_iterator_fall = function( it )
{
  var current = T_tree_iterator_node( it );
  if ( current == null )
  {
    it.nb_steps = -1;
    return;
  }

  while(current.left != null)
  {
    T_tree_iterator_push( it, false );
    current = current.left;
  }
}

/* static */ var T_tree_iterator_find_next = function( it )
{
  var current = T_tree_iterator_node( it );
  if ( current.right != null )
  {
    T_tree_iterator_push( it, true );
    T_tree_iterator_fall( it );
  }
  else
  {
    while( T_tree_iterator_has_next( it ) && T_tree_iterator_get( it ) )
    {
      T_tree_iterator_pop( it );
    }

    T_tree_iterator_pop( it );
  }
}

var T_tree_new_iterator = function( tree )
{
  var res = {};
  res.tree = tree;
  res.path = 0;
  res.nb_steps = 0;
  T_tree_iterator_fall( res );

  return res;
}

var T_tree_new_iterator_from_floor = function( tree, element )
{
  var res = { };
  res.tree = tree;
  res.path = 0;
  res.nb_steps = 0;

  if ( tree.root == null )
  {
    res.nb_steps = -1;
    return res;
  }

  res.nb_steps = 0;

  var node = tree.root;

  while( node != null )
  {
    var cmp = tree.comparator(element, T_node_value(node));
    if ( cmp < 0 )
    {
      T_tree_iterator_push( res, false );
      node = node.left;
    }
    else if ( cmp > 0 )
    {
      T_tree_iterator_push( res, true );
      node = node.right;
    }
    else
      return res;
  }

  T_tree_iterator_pop( res );

  var current = null;
  while( (current = T_tree_iterator_node( res )) != null )
  {
    var cmp = tree.comparator(element, T_node_value(current));
    if ( cmp < 0 )
      T_tree_iterator_pop( res );
    else
      break;
  }

  return res;
}

var T_tree_new_iterator_from_ceil = function( tree, element )
{
  var it = T_tree_new_iterator_from_floor( tree, element );
  var current = T_tree_iterator_node( it );

  if ( current == null )
  {
    /* special case: the "floor" is smaller than any element.
     * In that case, the ceil IS the first element. */
    return T_tree_new_iterator( tree );
  }

  var cmp = tree.comparator(element, T_node_value(current));
  if ( cmp != 0 )
    T_tree_iterator_find_next( it );

  return it;
}


var T_tree_iterator_has_next = function( it )
{
  return it.nb_steps >= 0;
}

var T_tree_iterator_next = function( it )
{
  if ( ! T_tree_iterator_has_next( it ) )
    return null;

  var current = T_tree_iterator_node( it );
  var res = T_node_value(current);

  T_tree_iterator_find_next( it );

  return res;
}

var T_tree_get_nth = function( tree, nth )
{
  //assert( tree->hasSize );
  //assert( nth < tree->size );

  var node = tree.root;

  while( node != null )
  {
    var left_size = T_node_size(node.left);

    if ( nth == left_size )
    {
      return T_node_value(node);
    }
    else if ( nth < left_size )
      node = node.left;
    else
    {
      nth -= left_size + 1;
      node = node.right;
    }
  }
}

/* static */ var T_tree_rec_index_of = function(
  tree,
  node,
  v_in,
  to_add)
{
  if ( node == null )
    return -1;

  var left_size = 0;
  if ( node.left != null )
    left_size = node.left.size;

  var cmp = tree.comparator(v_in, T_node_value(node));
  if ( cmp == 0 )
    return to_add + left_size;
  else if ( cmp < 0 )
    return T_tree_rec_index_of( tree, node.left, v_in, to_add );
  else
    return T_tree_rec_index_of( tree, node.right, v_in, to_add + left_size );
}

var T_tree_index_of = function( tree, v_in )
{
  //assert( tree->hasSize );

  return T_tree_rec_index_of( tree, tree.root, v_in, 0 );
}


/* Below is the javascript API, object-oriented style, but not too much */

function eve_create_tree( comparator, with_size )
{
  var t;
  if ( with_size )
    t = create_T_tree_with_size( comparator )
  else
    t = create_T_tree( comparator );



  var res = {
    destroy: function() { return T_tree_destroy( t ); },
    clear: function() { return T_tree_clear( t ); },
    on_all: function( consumer ) { return T_tree_on_all( t, consumer ); },
    size: function() { return T_tree_size( t ); },
    is_empty: function() { return T_tree_is_empty( t ); },
    add: function( x ) { return T_tree_add( t, x ); },
    remove: function( x ) { return T_tree_delete( t, x ); },
    get_same: function( x ) { return T_tree_get_same( t, x ); },
    contains: function( x ) { return T_tree_contains( t, x ); },
    min: function( ) { return T_tree_get_min( t ); },
    max: function( ) { return T_tree_get_max( t ); },
    set_freer: function( freer, userData ) { return T_tree_set_freer( t, freer, userData ); },

    new_iterator: function( ) { return iterator_reification( T_tree_new_iterator( t ) ); },
    new_iterator_from_floor: function ( x ) { return iterator_reification( T_tree_new_iterator_from_floor( t, x ) ); },
    new_iterator_from_ceil: function( x ) { return iterator_reification( T_tree_new_iterator_from_ceil( t, x ) ); },
  }

  if ( with_size )
  {
    res.nth = function( n ) { return T_tree_get_nth( t, n ); };
    res.index_of = function( x ) { return T_tree_index_of( t, x ); };
  }

  return res;
}

var iterator_reification = function( it )
{
  return {
    has_next: function( ) { return T_tree_iterator_has_next( it ); },
    next: function( ) { return T_tree_iterator_next( it ); }
  }
}
/*

EVEAPI T_tree_iterator_t T_tree_new_iterator( T_tree * tree );
EVEAPI T_tree_iterator_t T_tree_new_iterator_from_floor( T_tree * tree, void * element );
EVEAPI T_tree_iterator_t T_tree_new_iterator_from_ceil( T_tree * tree, void * element );
EVEAPI bool T_tree_iterator_has_next( T_tree_iterator_t * );
EVEAPI void T_tree_iterator_next( T_tree_iterator_t * , void * out );
EVEAPI void * T_tree_iterator_next_ptr_to_intern( T_tree_iterator_t * );

EVEAPI void T_tree_get_nth(T_tree * tree, void * out, size_t nth);
EVEAPI int64_t T_tree_index_of(T_tree * tree, const void * in);
*/

