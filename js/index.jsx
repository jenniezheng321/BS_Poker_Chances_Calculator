if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
      : match
      ;
    });
  };
}

class Card {
  constructor(num_num,suit_num) {
    if(num_num>=13 || num_num<0){
      throw 'Error invalid num number '+num_num;
    }
    if(suit_num>=4 || suit_num<0){
      throw 'Error invalid suit number '+suit_num;
    }
    this.num = num_num;
    this.suit = suit_num;
  }

  get suit_str(){
    return Card.suit_num_to_str(this.suit)
  }

  get num_str(){
    return Card.card_num_to_str(this.num)
  }

  static suit_num_to_str(num){
    switch (num) {
      case 0: return 'Spades'
      case 1: return 'Clubs'
      case 2: return 'Diamonds'
      case 3: return 'Hearts'
               }
  }

  static card_num_to_str(num){
    switch (num) {
      case 9: return 'Jack'
      case 10: return 'Queen'
      case 11: return 'King'
      case 12: return 'Ace'
      default: return (num+2).toString()
               }
  }

  static num_char(num){
    switch (num) {
      case 9: return 'J'
      case 10: return 'Q'
      case 11: return 'K'
      case 12: return 'A'
      default: return (num+2).toString()
               }
  }

  toString(){
    return "{0} of {1}".format(this.num_str, this.suit_str)
  }

  valueOf() {
    return this.num*10+this.suit
  }

}


class Card_Set {
  constructor(cards=[]) {
    this.cards=cards
    this.shuffleCards()
    this.pointer=0
    this.decks=1
  }

  fill_decks_no_shuffle(num_decks){
    this.decks=num_decks
    this.cards=[]
    for(let deck=0;deck<num_decks;deck++){
      for(let suit_num=0;suit_num<4;suit_num++){
        for(let num_num=0;num_num<13;num_num++){
          this.add(new Card(num_num,suit_num))
        }
      }
    }
  }

  fill_decks(num_decks){
    this.fill_decks_no_shuffle(num_decks)
    this.shuffleCards()
  }

  get length(){
    return this.cards.length
  }

  safe_add(card){
    let count=0
    for (let i=0;i<this.cards.length;i++){
      if(this.cards[i].valueOf()==card.valueOf())
        count+=1
    }
    if(count!=this.decks)
      this.add(card)
  }

  add(card){
    if(card instanceof Card)
      this.cards.push(card)
    else
      throw 'Error card not instanceof Card'
  }

  shuffleCards() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  indexOfCard(card){
    if(card instanceof Card){
      for (let i=0;i<this.cards.length;i++){
        if(this.cards[i].valueOf()==card.valueOf())
          return i
      }
      return -1
    }
    else
      throw 'Error card not instanceof Card'
  }

  remove(card){
    let index= this.indexOfCard(card)
    if(index!=-1)
      this.cards.splice( index, 1 );
  }

  toString(){
    let myString=''
    for (let card of this.cards){
      myString+=card.toString()+'; '
    }
    return myString
  }

  getCards(num){
    if(num > this.cards.length)
      throw 'Error tried to get '+num+' cards when only '+this.cards.length+' cards in set'
    if(this.pointer + num > this.cards.length){
      this.shuffleCards()
      this.pointer=0
    }
   let result=new Card_Set(this.cards.slice(this.pointer,this.pointer+num))
    if(result.length != num)
      throw 'Wrong length!'+' Wanted '+num+' but got '+result.length+' pointer at '+this.pointer
    this.pointer+=num
    return result
  }

  hasSpecificOfAKind(length,wanted_num){
    let num_of_kind=this.numSpecificOfAKind(wanted_num)
    return num_of_kind>=length
  }

  numSpecificOfAKind(wanted_num){
    let num_of_kind=0
    for (let card of this.cards){
      let num = card.num
      if(num == 0 || num == wanted_num)
        num_of_kind+=1
    }
    return num_of_kind
  }

  hasOfAKind(length){
    if(length > this.cards.length)
      return false
    for (let kind=0; kind<13; kind++)
      if(this.hasSpecificOfAKind(length,kind))
        return true
    return false
  }

  hasFullHouse(triple,double){
    let num_of_triple=0
    let num_of_double=0
    let num_wild=0
    for (let card of this.cards){
      if(card.num==0) num_wild+=1
      else if (card.num==triple) num_of_triple+=1
      else if (card.num==double) num_of_double+=1
    }
    let missing=Math.max(2-num_of_double,0)+ Math.max(3-num_of_triple,0)
    return num_wild>=missing
  }


  hasSuitSeperatedTrait(funcStr,...args){
    let suitSet=[]
    for(let i=0; i<4; ++i)
      suitSet.push(new Card_Set())
    for (let card of this.cards){
      if(card.num==0){
        for(let i=0; i<4; ++i)
          suitSet[i].add(card)
      }
      else{
        suitSet[card.suit].add(card)
      }
    }
    for(let i=0; i<4; ++i) {
      switch (funcStr){
        case 'hasSpecificFlushWithoutHigh'  :
          if(suitSet[i].hasSpecificFlushWithoutHigh(args,i)){
            return true
          }
          break
          case 'hasStraight'  :
          let arg= [...args]
          if(suitSet[i].hasStraight(arg[0])){
            return true
          }
          break
          case 'hasSpecificStraight'  :  if(suitSet[i].hasSpecificStraight(args,i))
            return true
          break
          default:
          throw 'invalid funcStr'
                     }
    }
    return false
  }

  hasSpecificFlushWithoutHigh(length,wanted_suit){
    if(length > this.cards.length)
      return false

    let suit_count=0
    for (let card of this.cards){
      let suit = card.suit
      let num = card.num
      if(num == 0 || suit == wanted_suit)
        suit_count+=1
    }
    return suit_count>=length
  }

  hasFlush(length){
    if(length > this.cards.length)
      return false
    return this.hasSuitSeperatedTrait('hasSpecificFlushWithoutHigh',length)
  }

  numSpecificFlush(wanted_suit,high){
    let has_high=false
    let suit_count=0
    for (let card of this.cards){
      let suit = card.suit
      let num = card.num
      if(num>high)
        continue
      if(num == 0 || suit == wanted_suit)
        suit_count+=1
      if(num == 0 || ( suit == wanted_suit && high == num))
        has_high=true
    }

    if(!has_high)
      return 0
    return suit_count
  }

  hasSpecificFlush(length,wanted_suit,high){
    let count=this.numSpecificFlush(wanted_suit,high)
    return count>=length
  }

  hasSpecificHigh(length,high){
    if(length > this.cards.length)
      return false

    let count=0
    let has_high=false

    for (let card of this.cards){
      if(card.num <= high)
        count+=1
      if(card.num==0 || card.num == high )
        has_high=true
    }
    return has_high && count>=length
  }

  hasSpecificStraight(length,high){
    if(length > this.cards.length || length > 13)
      return false

    let low=(high-length+1)%13
    if(low!=12 && low+length-1>12)
      return false

    let num_arr = []
    for(let i=0; i<13; ++i)
      num_arr.push(false)

    let num_wild=0
    for (let card of this.cards){
      if(card.num==0)
        num_wild+=1
      else
        num_arr[card.num]=true
    }

    for (let x=low; x<low+length; x++)
      if(!num_arr[x % 13]){
        num_wild-=1
        if(num_wild==-1)
          return false
      }
    return true
  }

  hasStraight(length){
    if(length > this.cards.length || length > 13)
      return false

    for (let high=length; high<13; high++){
      if(this.hasSpecificStraight(length,high)){
        return true
      }
    }

    return false
  }

  hasStraightFlush(length){
    if(length > this.cards.length || length > 13)
      return false

    if(!this.hasFlush())
      return false

    return this.hasSuitSeperatedTrait('hasStraight',length)
  }

  hasSpecificStraightFlush(length,suit,high){
    if(length > this.cards.length || length > 13)
      return false

    if(!this.hasSpecificFlush(length,suit,high)
       || !this.hasSpecificStraight(length,high))
      return false

    return this.hasSuitSeperatedTrait('hasSpecificStraight',length,high)
  }

  top_expected_straight(length){
    if(length==0){
      alert("length is 0")
      throw 'error: length=0 for top expected straight'
    }

    let arr = []
    for(let i=0; i<13; ++i)
      arr.push(false)

    for (let card of this.cards)
      if(card.num!=0)
        arr[card.num]=true

    let low_index=0
    let max_length=0
    let current_length=0
    //try start at ace
    for (let x=12; x<length+12; x++)
      if(arr[x%13]){
        current_length+=1
        if(max_length<=current_length){
          max_length=current_length
        }
      }
    for (let x=length+12; x<length+24; x++){
      if(arr[(x-length)%13]){
        current_length-=1
         //alert('removed'+Card.card_num_to_str((x-length)%13)+
        //     'for new length '+current_length.toString())
        }
      if(arr[x%13]){

        current_length+=1
        // alert('added'+Card.card_num_to_str(x%13)+
        //     'for new length '+current_length.toString())
        }
      if(max_length<current_length){
        max_length=current_length
        low_index=(x-length+1)
       // alert("neww low"+Card.card_num_to_str(low_index%13)+
       //      'for new length '+current_length.toString())
      }
    }

    //should never be 0
   // alert(Card.card_num_to_str(low_index%13))
    if(low_index%13==0)
      low_index+=1
    let high=(low_index+length-1)%13
    return [high,max_length]
  }

  top_of_a_kind(){
    let [first_index,second_index,first_count,second_count]=this.top_of_two_kinds()

    return [first_index,first_count]
  }

  top_of_two_kinds(){
    let num_wild=0
    let num_arr = []
    for(let i=0; i<13; ++i)
      num_arr.push(0)
    for (let card of this.cards)
      if(card.num!=0)
        num_arr[card.num]+=1
    else
      num_wild+=1

    let first_count=0, second_count=0
    let first_index=0, second_index=0
    for (let x=0; x<13; ++x)
      if(num_arr[x]>=first_count){
        second_count=first_count
        second_index=first_index
        first_count=num_arr[x]
        first_index=x
      }
      else if (num_arr[x]>=second_count){
        second_count=num_arr[x]
        second_index=x
      }
    if(first_index==0)
      first_index=1
    if(second_index==0)
      second_index=1
    if(first_index==second_index)
      first_index=(second_index+1)%13
    return [first_index,second_index,first_count+num_wild,second_count]
  }

  top_suit(){
    let num_wild=0
    let suits=[0,0,0,0]
    let highs=[0,0,0,0]
    for (let card of this.cards){
      if(card.num!=0){
        suits[card.suit]+=1
        if(highs[card.suit]<card.num)
          highs[card.suit]=card.num
      }
      else
        num_wild+=1
    }

    let max_suit=0
    let max_suit_count=0
    for (let x=0; x<4; ++x)
      if(suits[x]>max_suit_count ||
         (suits[x]==max_suit_count && highs[max_suit] <= highs[x])){
        max_suit_count=suits[x]
        max_suit=x
      }
    return [max_suit,highs[max_suit],max_suit_count+num_wild]
  }

  top_expected_straight_flush(length){
    let best_suit=0
    let best_length=0
    let best_high=0

    let suitSet=[]
    for(let i=0; i<4; ++i)
      suitSet.push(new Card_Set())

    for (let card of this.cards){
      if(card.num==0){
        for(let i=0; i<4; ++i)
          suitSet[i].add(card)
      }
      else{
        suitSet[card.suit].add(card)
      }
    }

    for (let x=0; x<4; ++x) {

      let [high,mlength]=suitSet[x].top_expected_straight(length)
      if(mlength>best_length){
        best_length=mlength
        best_suit=x
        best_high=high
      }
    }

    return [best_suit,best_high,best_length]
  }

}



class Optimal {
  constructor(cards,decks,trials){
    //alert(cards+' '+decks+' '+trials)
    this.cards=cards
    this.decks=decks
    this.trials=trials
  }
  rank_general_chances() {
    let cards=this.cards,decks=this.decks,trials=this.trials
    let results = {}
    //fill results
    for(let i=2; i<=decks*8; i++){
      let target=i+" of a kind"
      results[target]=0
    }

    for(let i=5; i<=cards; i++){
      let target=i+" long flush"
      results[target]=0
    }

    for(let i=5; i<=13; i++){
      let target=i+" long straight"
      results[target]=0
    }

    for(let i=5; i<=13; i++){
      let target=i+" long straight flush"
      results[target]=0
    }

    let deck = new Card_Set()
    //fill up card set
    deck.fill_decks(decks)

    for (let trial=0; trial<trials; ++trial){
      let card_set=deck.getCards(cards)
      let [_,longest_of_kind]=card_set.top_of_a_kind()
      let [____,__,longest_flush]=card_set.top_suit()
      let longest_straight=0,longest_straight_flush=0
      let curr_length=5
      while(card_set.hasStraight(curr_length)){
        longest_straight=curr_length
        curr_length+=1
      }
      //temp
      curr_length=5
      while(card_set.hasStraightFlush(curr_length)){
        longest_straight_flush=curr_length
        curr_length+=1
      }
      for(let i=2; i<=longest_of_kind; i++){
        let target=i+" of a kind"
        results[target]+=1
      }

      for(let i=5; i<=longest_flush; i++){
        let target=i+" long flush"
        results[target]+=1
      }

      for(let i=5; i<=longest_straight; i++){
        let target=i+" long straight"
        results[target]+=1
      }

      for(let i=5; i<=longest_straight_flush; i++){
        let target=i+" long straight flush"
        results[target]+=1
      }
    }

    let arr = [];
    for (let key in results) {
      if(results[key]>.001)
        arr.push( [ results[key]*100.0/trials, key] );
    }

    arr.sort(function(x, y) { if (x[0] > y[0]) return 1
                             else if (x[0]==y[0]) return 0
                             else return -1
                            });

    for (let res of arr) {
      //if(res[0]>=.01)
      //console.log(res[0]+'% chance '+res[1])
    }
    return arr
  }

  rank_specific_chances(myknown) {

    this.specific_ranks_dict={}

    let results=this.specific_ranks_dict
    results["Full house, specified triple and double"]=0

    //fill results
    for(let i=2; i<=this.decks*8; i++)
      results[i+" of a kind, specified rank"]=0

    for(let i=5; i<=this.cards; i++){
      results[i+" long flush, specified suit and own card high"]=0
      results[i+" long flush, specified suit and Ace high"]=0
    }

    for(let i=5; i<=13; i++){
      results[i+" long straight, specified high"]=0
      results[i+" long straight flush, specified suit and high"]=0
    }

    let num_hands=Math.sqrt(this.trials);
    let deck = new Card_Set()
    deck.fill_decks(this.decks)
    /**/
    for (let trial=0; trial<num_hands; ++trial){
      let card_set = deck.getCards(myknown)
      this.rank_specific_chances_helper(card_set)
    }

    let total_trials=Math.floor(num_hands)*Math.floor(num_hands)
    let arr = []

    for (let key in  this.specific_ranks_dict) {
      if(results[key]>.001)
        arr.push( [ this.specific_ranks_dict[key]*100.0/total_trials, key] );
    }

    arr.sort(function(x, y) { if (x[0] > y[0]) return 1
                             else if (x[0]==y[0]) return 0
                             else return -1
                            })

    for (let res of arr) {
      if(res[0]>=.01)
        console.log('spe '+res[0]+'% chance '+res[1])
    }

    return arr

  }

  rank_specific_chances_helper(hand) {
    if(this.cards<hand.length)
      throw 'Error: hand too large'

    let cards=hand, decks=this.decks,trials=Math.sqrt(this.trials)
    //alert(cards.toString())
    let deck = new Card_Set()

    //fill up card set
    deck.fill_decks(decks)

    for (let card of cards.cards)
      deck.remove(card)

    let [best_kind,___]=cards.top_of_a_kind()
    let [best_suit,best_flush_high,_]=cards.top_suit()
    let [fullHhouseIndex1,fullHhouseIndex2]=cards.top_of_two_kinds()
    let straight_arr=[],straight_flush_arr=[]
    let results=this.specific_ranks_dict
    for (let x=5; x<=13; x++){
      let [high,_]=cards.top_expected_straight(x)
      let [suit,fhigh,__]=cards.top_expected_straight_flush(x)
      straight_arr.push(high)
      straight_flush_arr.push([suit,fhigh])
    }


    for (let trial=0; trial<trials; ++trial){

      let card_set_addition = deck.getCards(this.cards-hand.length)
      let card_set= new Card_Set(cards.cards.concat(card_set_addition.cards));
      let longest_straight=1,longest_straight_flush=1
      let curr_length=5
      while(card_set.hasSpecificStraight(curr_length, straight_arr[curr_length-5])){

        longest_straight=curr_length
        curr_length+=1
      }
      //temp
      curr_length=5

      while(card_set.hasSpecificStraightFlush(curr_length, straight_flush_arr[curr_length-5][0], straight_flush_arr[curr_length-5][1])){

        longest_straight_flush=curr_length
        curr_length+=1
      }

      if(card_set.hasFullHouse(fullHhouseIndex1,fullHhouseIndex2)){
        let target="Full house, specified triple and double"
        results[target]+=1
      }

      let longest_of_kind = card_set.numSpecificOfAKind(best_kind)
      let longest_flush = card_set.numSpecificFlush(best_suit,best_flush_high)

      //ace high
      let longest_flush_alt= card_set.numSpecificFlush(best_suit,10)

      for(let i=2; i<=longest_of_kind; i++){
        let target=i+" of a kind, specified rank"
        results[target]+=1
      }

      for(let i=5; i<=longest_flush; i++){
        let target=i+" long flush, specified suit and high"
        results[target]+=1
      }

      for(let i=5; i<=longest_flush_alt; i++){
        let target=i+" long flush, specified suit and own card high"
        results[target]+=1
      }

      for(let i=5; i<=longest_straight; i++){
        let target=i+" long straight, specified high"
        results[target]+=1
      }

      for(let i=5; i<=longest_straight_flush; i++){
        let target=i+" long straight flush, specified suit and high"
        results[target]+=1
      }
    }


  }

    find_best_play(hand){
    if(hand.length<=0)
       throw 'Error: hand too small'

    if(this.cards-hand.length<0)
      throw 'Error: hand too large'

    let cards=hand, decks=this.decks,trials=this.trials
    //alert(cards.toString())
    let deck = new Card_Set()

    //fill up card set
    deck.fill_decks(decks)

    for (let card of cards.cards)
      deck.remove(card)

    let results = {}
    let [best_kind,___]=cards.top_of_a_kind()
    let [best_suit,best_flush_high,_]=cards.top_suit()
    let straight_arr=[],straight_flush_arr=[]

    for (let x=5; x<=13; x++){
      let [high,_]=cards.top_expected_straight(x)
      let [suit,fhigh,__]=cards.top_expected_straight_flush(x)
      straight_arr.push(high)
      straight_flush_arr.push([suit,fhigh])
    }
    //alert(Card.card_num_to_str(straight_arr[1]))

    let [fullHhouseIndex1,fullHhouseIndex2]=cards.top_of_two_kinds()

    let htarget="Full house, "+ Card.card_num_to_str(fullHhouseIndex1)+' on '+Card.card_num_to_str(fullHhouseIndex2)
    results[htarget]=0

    //fill results
    for(let i=2; i<=decks*8; i++){
      let target=i+" of a kind "+ Card.card_num_to_str(best_kind)
      results[target]=0
    }

    for(let i=5; i<=this.cards; i++){
      let target=i+" long "+ Card.suit_num_to_str(best_suit) +" flush, " +Card.card_num_to_str(best_flush_high)+' high'
      let target2=i+" long "+ Card.suit_num_to_str(best_suit) +" flush, Ace high"
      results[target]=0
      results[target2]=0
    }

    for(let i=5; i<=13; i++){
      let target=i+" long straight, "+Card.card_num_to_str(straight_arr[i-5])+" high"
      results[target]=0
    }


    for(let i=5; i<=13; i++){
      let target=i+" long straight "+Card.card_num_to_str(straight_flush_arr[i-5][0])+" flush, "+
          Card.card_num_to_str(straight_flush_arr[i-5][1])+" high"
      results[target]=0
    }


    for (let trial=0; trial<trials; ++trial){
      let card_set_addition = deck.getCards(this.cards-hand.length)
      let card_set= new Card_Set(cards.cards.concat(card_set_addition.cards));
      let longest_straight=1,longest_straight_flush=1
      let curr_length=5
      while(card_set.hasSpecificStraight(curr_length, straight_arr[curr_length-5])){
        longest_straight=curr_length
        curr_length+=1
      }
      //temp
      curr_length=5
      while(card_set.hasSpecificStraightFlush(curr_length, straight_flush_arr[curr_length-5][1], straight_flush_arr[curr_length-5][0])){
        longest_straight_flush=curr_length
        curr_length+=1
      }

      if(card_set.hasFullHouse(fullHhouseIndex1,fullHhouseIndex2)){
        let target="Full house, "+ Card.card_num_to_str(fullHhouseIndex1)+' on '+Card.card_num_to_str(fullHhouseIndex2)
        results[target]+=1
      }

      let longest_of_kind = card_set.numSpecificOfAKind(best_kind)
      let longest_flush = card_set.numSpecificFlush(best_suit,best_flush_high)
      //ace high
      let longest_flush_alt=0
      if(best_flush_high!=12)
        longest_flush_alt=card_set.numSpecificFlush(best_suit,12)

      for(let i=2; i<=longest_of_kind; i++){
        let target=i+" of a kind "+ Card.card_num_to_str(best_kind)
        results[target]+=1
      }

      for(let i=5; i<=longest_flush; i++){
        let target=i+" long "+ Card.suit_num_to_str(best_suit) +" flush, " +Card.card_num_to_str(best_flush_high)+' high'
        results[target]+=1
      }


      for(let i=5; i<=longest_flush_alt; i++){
        let target=i+" long "+ Card.suit_num_to_str(best_suit) +" flush, Ace high"
        results[target]+=1
      }

      for(let i=5; i<=longest_straight; i++){
        let target=i+" long straight, "+Card.card_num_to_str(straight_arr[i-5])+" high"
        results[target]+=1
      }

      for(let i=5; i<=longest_straight_flush; i++){
        let target=i+" long straight "+Card.card_num_to_str(straight_flush_arr[i-5][0])+" flush, "
        Card.card_num_to_str(straight_flush_arr[i-5][1])+" high"
        results[target]+=1
      }
    }

    let arr = [];
    for (let key in results) {

      if(results[key]>.001)
        arr.push( [results[key]*100.0/trials, key] );
    }

    arr.sort(function(x, y) { if (x[0] > y[0]) return 1
                             else if (x[0]==y[0]) return 0
                             else return -1
                            });

    for (let res of arr) {
      //if(res[0]>=.01)
      //console.log(res[0]+'% chance '+res[1])
    }
    return arr.reverse()
  }


  find_bs_chance({call,length,suit,primary,secondary,hand}){

    if(hand.length<=0)
       throw 'Error: hand too small'

    if(this.cards-hand.length<0)
      throw 'Error: hand too large'

    let cards=hand, decks=this.decks,trials=this.trials
    //alert(cards.toString())
    let deck = new Card_Set()

    //fill up card set
    deck.fill_decks(decks)

    for (let card of cards.cards)
      deck.remove(card)

    let count=0


    let key=''
     switch (call){
        case 'kind': key= length+" of a kind "+ Card.card_num_to_str(primary)
          break;
        case 'flush': key= length+" long "+ Card.suit_num_to_str(suit) +" flush, " +Card.card_num_to_str(primary)+' high'

          break;
        case 'straight': key=length+" long straight, "+Card.card_num_to_str(primary)+" high"

          break;
        case 'straightflush': key=length+" long straight "+Card.suit_num_to_str(suit)+" flush, "+
          Card.card_num_to_str(primary)+" high"

          break;
         case 'house': key="Full house, "+ Card.card_num_to_str(primary)+' on '+Card.card_num_to_str(secondary)
          break;
         }
    for (let trial=0; trial<trials; ++trial){
       let card_set_addition = deck.getCards(this.cards-hand.length)
        let card_set= new Card_Set(cards.cards.concat(card_set_addition.cards));
      switch (call){
        case 'kind': if(card_set.hasSpecificOfAKind(length,primary)) count+=1
          break;
        case 'flush': if(card_set.hasSpecificFlush(length,suit,primary)) count+=1
          break;
        case 'straight': if(card_set.hasSpecificStraight(length,primary)) count+=1
          break;
        case 'straightflush': if(card_set.hasSpecificStraightFlush(length,suit,primary)) count+=1
          break;
         case 'house': if(card_set.hasFullHouse(primary,secondary)) count+=1
          break;
         }

      }

    let arr = [[count*100.0/trials, key]];
    return arr
  }

}


let tut1=new Card_Set()
    tut1.add(new Card(3,2))
    tut1.add(new Card(7,0))
    tut1.add(new Card(8,0))
    tut1.add(new Card(9,1))
    tut1.add(new Card(0,3))
    tut1.add(new Card(11,2))
    tut1.add(new Card(12,1))

let tut2=new Card_Set()
    tut2.add(new Card(0,3))
    tut2.add(new Card(0,2))
    tut2.add(new Card(11,1))
    tut2.add(new Card(12,3))
    tut2.add(new Card(12,2))
    tut2.add(new Card(12,1))

let tut3=new Card_Set()
    tut3.add(new Card(0,3))
    tut3.add(new Card(1,3))
    tut3.add(new Card(4,3))
    tut3.add(new Card(10,3))
    tut3.add(new Card(11,3))
    tut3.add(new Card(12,3))

let tut4=new Card_Set()
    tut4.add(new Card(0,3))
    tut4.add(new Card(1,1))
    tut4.add(new Card(1,3))
    tut4.add(new Card(2,2))
    tut4.add(new Card(7,1))

class Rules extends React.Component {
  render() {
    return <div className="rules jumbotron">
  <h1>How To</h1>
      <h3>Rules</h3>
  <ul>
 <li>Every player starts with 2 cards.</li>
    <li>The players take turns going clockwise. Each turn, a player can call a higher hand or call BS on the previously called hand.</li>
       <li>The player who lost a card gets to go first, or if that player is out, the next player goes first.</li>
          <li>Players may only see their own hand but are calling hands regarding the cards pooled together by all players.</li>
             <li>When a player calls BS, all players reveal their cards and sees whether the hand can be formed from 5 or more of the total cards</li>
    <li>If the hand exists, the BS failed and the player who called BS gains a card.</li>
     <li>If the hand doesn't exist, the BS succeeded and the player who called the hand gains a card.</li>
    <li>The person who lost starts the next round.</li>
    <li>A player is out when they have 6 cards in their hand.</li>
    <li>The game continues until only one player is left.</li>
  </ul>

      <h3>Hands</h3>
  <ul>
    <li>Jokers are not part of the deck.</li>
 <li>2's are wild cards which can be substituted for any rank or suit.</li>
    <li>All regular poker hands are valid.</li>
    <li>Straights, flushes, straight flushes, and of a kinds can extend beyond 5 cards</li>
  </ul>

       <h3>Examples</h3>
  <ul><li> The following contains a 6 long straight Ace high, because the wild card 2 can act as a queen.
      <CardSetIcon cards={tut1.cards} />
     </li>
    <br/>
    <li> The following does not contain a full house, 3 on 9. The wild card may act as either the third 3 or the second 9, but it cannot be both.
      <CardSetIcon cards={tut4.cards} />
    </li>
    <br/>
    <li> The following contains an Ace five of a kind, thanks to double wilds.
      <CardSetIcon cards={tut2.cards} />
    </li>
    <br/>
    <li> The following does not contain a hearts flush, Queen high. While there are enough hearts, only 4 are capable of being equal or below Queen (2, 3, 6, and Q).
      <CardSetIcon cards={tut3.cards} />
    </li>
   </ul>
</div>


  }
}


class Bar extends React.Component{
  render() {
    let divStyle = {
      width: this.props.percent+'%',
    }

    return (
      <skill className="bar_container">
        <div className="bar" style={divStyle}> {this.props.description+': '+this.props.percent+'%'}</div>
      </skill>
    );
  }
}


class Bar_Graph extends React.Component {
  render() {
    let results=this.props.data
    return  <div className='bar_graph'>
      <div className="title">
        <h1>{this.props.name} </h1>
      </div>
      <section className="graph">
        { results.map(function(result){
          return <Bar percent={result[0].toFixed(3)} description={result[1]} />;
        }) }
      </section>
      <div>
         {this.props.description.split("\n").map(i => {
            return <p className='bar_description'>{i}</p>;
        })}
      </div>
    </div>
  }

}

let default_known=3,default_cards=15,default_decks=2,default_trials=10000
let default_hand=new Card_Set()
default_hand.add(new Card(9,0))
default_hand.add(new Card(10,1))
default_hand.add(new Card(3,3))
let default_hand_choices=new Card_Set()
default_hand_choices.fill_decks_no_shuffle(1)



class Hand_Options extends React.Component{
  constructor() {
    super();
    this.state = {
      hand: default_hand
    };
  }

  cardAdded(num,suit){
    this.state.hand.decks=default_decks
    this.state.hand.safe_add(new Card(num,suit))
    this.setState({hand:this.state.hand})
  }

  cardRemoved(num,suit){
    this.state.hand.remove(new Card(num,suit))
    this.setState({hand:this.state.hand})
  }


  render(){
    return <div className='hand_options jumbotron'> <div className="hand_choices">
      <h1>Hand</h1>
      <p>Add and remove cards from your hand by clicking on the cards. You can hold as many of the same card as the number of decks you have.</p>
      <div id='myhand'>
       <HandCardSetIcon cb={this.cardRemoved.bind(this)} cards={this.state.hand.cards} />
        </div>
      <br/>
      <br/>
      <HandCardSetIcon cb={this.cardAdded.bind(this)} cards={default_hand_choices.cards.slice(0,13)} />
      <HandCardSetIcon cb={this.cardAdded.bind(this)} cards={default_hand_choices.cards.slice(13,26)} />
      <HandCardSetIcon cb={this.cardAdded.bind(this)} cards={default_hand_choices.cards.slice(26,39)} />
      <HandCardSetIcon cb={this.cardAdded.bind(this)} cards={default_hand_choices.cards.slice(39,52)} />
      </div>
    </div>
  }
}


class Deck_Options extends React.Component{

  handleCardsChange (event) {
    let value=parseInt(event.target.value)
    default_cards=value
  }


  handleDecksChange (event) {
    let value=parseInt(event.target.options[event.target.selectedIndex].value)
    default_decks=value
  }

  handleTrialsChange (event) {
     let value=parseInt(event.target.options[event.target.selectedIndex].value)
    default_trials=value
  }

  render() {
    let d1=(default_decks==1) ? <option selected value="1">1</option>
        : <option value="1">1</option>
    let d2=(default_decks==2) ? <option selected value="2">2</option>
        : <option value="2">2</option>
    let d3=(default_decks==3) ? <option selected value="3">3</option>
        : <option value="3">3</option>
    let d4=(default_decks==4) ? <option selected value="4">4</option>
        : <option value="4">4</option>
     let d5=(default_decks==8) ? <option selected value="8">8</option>
        : <option value="8">8</option>
      let d6=(default_decks==32) ? <option selected value="32">32</option>
        : <option value="32">32</option>
       let d7=(default_decks==128) ? <option selected value="128">128</option>
        : <option value="128">128</option>

    let t1=(default_trials==100) ? <option selected value="100">100</option>
        : <option value="100">100</option>
    let t2=(default_trials==1000) ? <option selected value="1000">1000</option>
        : <option value="1000">1000</option>
    let t3=(default_trials==10000) ? <option selected value="10000">10000</option>
        : <option value="10000">10000</option>
    let t4=(default_trials==100000) ? <option selected value="100000">100000</option>
        : <option value="100000">100000</option>

    return <div className='deck_options jumbotron'>
      <h1>Deck Options</h1>
    <p>What's the total number of cards possessed by all players? How many decks are within play? How many trials to run?</p>
      <div className="form-inline deck">
          <label className="mr-sm-2" for="inlineFormInput">Total</label>
        <input defaultValue={default_cards} onChange={this.handleCardsChange.bind(this)} type="number" className="num_input form-control mb-2 mr-sm-2 mb-sm-0" />

        <label className="mr-sm-2" for="inlineFormCustomSelect">Decks</label>
        <select onChange={this.handleDecksChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {d1}
          {d2}
          {d3}
          {d4}
          {d5}
          {d6}
          {d7}
        </select>

        <label className="mr-sm-2" for="inlineFormCustomSelect">Trials</label>
        <select onChange={this.handleTrialsChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {t1}
          {t2}
          {t3}
          {t4}
        </select>
         </div>


    </div>
  }
}


class Known_Option extends React.Component{
  handleKnownCardsChange (event) {
    let value=parseInt(event.target.value)
    default_known=value
  }

  render() {
    return <div className='deck_options jumbotron'>
      <h1>Known Cards</h1>
        <p>Out of the total cards, how many do you know about?</p>
      <div className="form-inline deck">

        <label className="mr-sm-2" >Known</label>
        <input defaultValue={default_known} onChange={this.handleKnownCardsChange.bind(this)} type="number" className="num_input form-control mb-2 mr-sm-2 mb-sm-0" />
      </div>
    </div>
  }
}

let default_length=5
let default_suit=0
let default_primary_rank=2
let default_secondary_rank=3
let default_call='kind'

class Call_Picker extends React.Component{
 constructor() {
    super()
    this.state = {
      call: default_call
    }
  }

  handlePrimaryRankChange (event) {
    let value=parseInt(event.target.value)
    default_primary_rank=value
  }
   handleSecondaryRankChange (event) {
    let value=parseInt(event.target.value)
    default_secondary_rank=value
  }
  handleSuitChange(event){
    let value=parseInt(event.target.value)
    default_suit=value
  }
handleLengthChange(event){
    let value=parseInt(event.target.value)
    default_length=value
  }
  handleCallChange(event){
    let value=event.target.value
    default_call=value
    this.setState({call:default_call})
  }

  render() {

    let calls=[ ['kind','Number of a Kind'],
                ['flush','Flush'],
                ['straight','Straight'] ,
                ['straightflush','Straight Flush'],
                ['house','Full House']]
    let length_button=   <div className="form-inline">
        <select onChange={this.handleLengthChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {Array.apply(null, Array(15)).map(function (_, i) {return (
            (default_length==i+1) ? <option selected value={i+1}>{i+1}</option>
            : <option value={i+1}>{i+1}</option>
              ) }) }
        </select>
          </div>
    let suit_button=<div className="form-inline">
        <select onChange={this.handleSuitChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {Array.apply(null, Array(4)).map(function (_, i) {return (
            (default_suit==i) ? <option selected value={i}>{Card.suit_num_to_str(i)}</option>
            : <option value={i}>{Card.suit_num_to_str(i)}</option>
              ) }) }
        </select></div>
    let primary_button=<div className="form-inline">
        <select onChange={this.handlePrimaryRankChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {Array.apply(null, Array(13)).map(function (_, i) {return (
            (default_primary_rank==i) ? <option selected value={i}>{Card.card_num_to_str(i)}</option>
            : <option value={i}>{Card.card_num_to_str(i)}</option>
              ) }) }
        </select></div>
    let secondary_button=<div className="form-inline">
        <select onChange={this.handleSecondaryRankChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {Array.apply(null, Array(13)).map(function (_, i) {return (
            (default_secondary_rank==i) ? <option selected value={i}>{Card.card_num_to_str(i)}</option>
            : <option value={i}>{Card.card_num_to_str(i)}</option>
              ) }) }
        </select></div>

      let myform=''
    if(default_call=='kind')  myform= <div className="form-inline">
       {length_button}
        <label className="mr-sm-2" for="inlineFormCustomSelect"> of a kind rank </label>
       {primary_button}
      </div>
   else if(default_call=='house')  myform= <div className="form-inline">
       <label className="mr-sm-2" for="inlineFormCustomSelect">Triple </label>
       {primary_button}
        <label className="mr-sm-2" for="inlineFormCustomSelect"> with double</label>
       {secondary_button}
      </div>
     else if(default_call=='straight')  myform= <div  className="form-inline">
         <label className="mr-sm-2" for="inlineFormCustomSelect">Length </label>
       {length_button}
          <label className="mr-sm-2" for="inlineFormCustomSelect"> straight with high </label>
       {primary_button}
      </div>
     else if(default_call=='flush')  myform= <div  className="form-inline">
          <label className="mr-sm-2" for="inlineFormCustomSelect">Length </label>
       {length_button}
          <label className="mr-sm-2" for="inlineFormCustomSelect"> suit </label>
          {suit_button}
          <label className="mr-sm-2" for="inlineFormCustomSelect"> flush with high </label>
         {primary_button}
      </div>
     else if(default_call=='straightflush')  myform= <div  className="form-inline">
         <label className="mr-sm-2" for="inlineFormCustomSelect">Length </label>
       {length_button}
         <label className="mr-sm-2" for="inlineFormCustomSelect"> suit </label>
       {suit_button}
         <label className="mr-sm-2" for="inlineFormCustomSelect"> straight flush with high </label>
       {primary_button}
      </div>

    return <div className='jumbotron'>
      <h1>Call Options</h1>
    <p>What call do you want to investigate? Each call requires different additional input.</p>
       <div>
         <label className="mr-sm-2" for="inlineFormCustomSelect">Call</label>
        <select onChange={this.handleCallChange.bind(this)} className="custom-select mb-2 mr-sm-2 mb-sm-0">
          {calls.map(function (call) {return (
            (default_call==call[0]) ? <option selected value={call[0]}>{call[1]}</option>
            : <option value={call[0]}>{call[1]}</option>
              ) }) }
        </select>
         </div>
     <br/>
      {myform}
      </div>
  }
}


class Calculator extends React.Component {
  constructor() {
    super()
    this.state = {
      page: 'about',
      data: []
    }
  }

  run() {
    let  opt= new Optimal(default_cards,default_decks,default_trials)
    let data=[]
     if(default_cards <5){
      alert('Error: total cards must be at least 5')
      return
    }
    else if( default_cards > default_decks*52){
      alert('Error: total cards cannot be more than number of decks * 52')
      return
    }

    if(this.state.page=='general'){

        data=opt.rank_general_chances()
    }

    else if(this.state.page=='specific'){
        if(default_known <= 0){
          alert('Error: known cards must be greater than 0')
          return
        }
        else if( default_known > default_cards ){
          alert('Error: known cards cannot be greater than total cards')
          return
        }
        data=opt.rank_specific_chances(default_known)
    }

    else if(this.state.page=='play'){
        if(default_hand.length>=default_cards){
        alert('Error: hand cannot be larger than number of total cards')
         return
      }
        data=opt.find_best_play(default_hand)
    }

    else if(this.state.page=='isBS'){
       if(default_hand.length>=default_cards){
        alert('Error: hand cannot be larger than number of total cards')
         return
      }
       if(default_length<5 && default_call!='kind'){
        alert('Error: length but be at least 5 for your call')
         return
      }
        data=opt.find_bs_chance({hand:default_hand,call:default_call,
                                length:default_length,primary:default_primary_rank,
                                secondary:default_secondary_rank,suit:default_suit})
    }
    this.setState({data: data })
  }

   onPageChanged(page) {
    this.setState({ page: page, data: [] })
  }


  render(){
    let remaining=default_cards - default_known
    let deck_word='deck'
    if(this.state.decks>1)
      deck_word=this.state.decks+' decks'
    let deck_opts=<Deck_Options />
    let run_button= <div className='run'><button className='btn-success btn btn-block' onClick={this.run.bind(this)}>Calculate</button></div>
    let spe_des='Here are odds that a set of '+default_cards+
          " cards from "+default_decks+" decks contains the particular BS call from each category which has the highest chance of occuring, based on the "+default_known+" known cards. \nFor each of "+default_trials+" trials, the program chose a psuedorandom hand of "+default_known+' cards from the '+deck_word+" and call the most likely BS call from each combination. For example, when the hand contained a large number of fives, the program called 4 of a kind fives rather than 4 of a kind sixes for the four of a kind combination. Then the program added a psuedorandom set of "+remaining+" cards to the hand and checked for the existance of each call. \nIf a particular call is not shown, it means the program found the combination less than .01% of the time. Keep in mind that these odds assume that 2's are wild cards."
    let best_des='Here are BS calls which have the highest chance of being true, given  a set of '+default_cards+
          " cards from "+default_decks+" decks which includes the hand "+default_cards.toString()
            +" selected above. \nFor each of "+default_trials+" trials, the program added a psuedorandom set of  "+remaining+" cards to the hand and checked for the existance of each call. \nIf a particular call is not shown, it means the program found the combination less than .01% of the time. Keep in mind that these odds assume that 2's are wild cards."
    let gen_des='Here are odds that a set of '+default_cards+
          " cards from the "+deck_word+" contains each BS combination (four of a kind, any flush, any straight, etc). \nFor each of "+default_trials+" trials, the program chose a psuedorandom set of "+default_cards+' cards from the '+deck_word+" and judged whether the set contained each particular combition. \nIf a particular combination is not shown, it means the program found the combination less than .01% of the time. Keep in mind that these odds assume that 2's are wild cards."
    let bs_desc='Above is the chance that the call is valid.'
    let main=''

    switch(this.state.page){
      case 'about': main=<Rules />
      break
       case 'general': main=<div> {deck_opts}
        {run_button}
        <Bar_Graph data={this.state.data}
        name='General Chances'
        description={gen_des} />
         </div>
         break
        case 'specific': main=<div>
         {deck_opts}
        < Known_Option />
         {run_button}
         <Bar_Graph data={this.state.data}
        name='Specific Chances'
           description={spe_des} />
         </div>
         break
         case 'play':  main=<div>
         {deck_opts}
         <Hand_Options  />
         {run_button}
      <Bar_Graph data={this.state.data}
        name='Best Plays'
        description={best_des} />
         </div>
         break
          case 'isBS':  main=<div>
         {deck_opts}
         <Call_Picker />
         <Hand_Options  />

         {run_button}
      <Bar_Graph data={this.state.data}
        name='Validity of Call'
        description={bs_desc} />
         </div>
         break
   }

    return <div>
      <NavBar cb={this.onPageChanged.bind(this)}/>
      {main}
      <Footer/>
    </div>
  }

}


class CardIcon extends React.Component {
  render() {
    let word=<p/>
      let style={};
    if(this.props.suit>=2)
      style={ color: '#C30A0A'};
      switch(this.props.suit){
        case 0: word=<p style={style}>&spades;</p>
        break
        case 1: word=<p style={style}>&clubs;</p>
        break
        case 2: word=<p style={style}>&diams;</p>
        break
        case 3: word=<p style={style}>&hearts;</p>
        break
      }

    return <div className="card" >
      {word}
      <p style={style}>{Card.num_char(this.props.num)} </p>
    </div>;
  }
}

class NavBar extends React.Component {
  constructor() {
    super()
    this.state = {
      page: 'about'
    }
  }

  onPageChanged(newPage) {
    this.setState({ page: newPage })
    this.props.cb(newPage)
  }

  render() {
    let reg="nav-item nav-link"
    let active="nav-item nav-link active"
    return <nav className="navbar navbar-toggleable-md navbar-light bg-faded">
  <p className="navbar-brand">BS</p>
    <div className="navbar-nav">
      <a className={this.state.page=='about' ? active: reg}  onClick={this.onPageChanged.bind(this,'about')} >About </a>
      <a className={this.state.page=='general' ? active: reg}   onClick={this.onPageChanged.bind(this,'general')} >GeneralRank</a>
      <a className={this.state.page=='specific' ? active: reg}   onClick={this.onPageChanged.bind(this,'specific')} >SpecificRank</a>
      <a className={this.state.page=='play' ?  active: reg}   onClick={this.onPageChanged.bind(this,'play')} >BestPlay</a>
       <a className={this.state.page=='isBS' ?  active: reg}   onClick={this.onPageChanged.bind(this,'isBS')} >BSChecker</a>
    </div>
</nav> }
}

class HandCardIcon extends React.Component {
  constructor() {
    super();
  }

  clicked(){
    this.props.cb(this.props.num,this.props.suit)
  }

  render() {
    return <a onClick={this.clicked.bind(this)}>
      <CardIcon suit={this.props.suit} num={this.props.num} />
    </a>
  }
}

class HandCardSetIcon extends React.Component {
  render() {
    let cb=this.props.cb

    return <div className="container cardset">
        { this.props.cards.map(function(card){
          return <HandCardIcon suit={card.suit} num={card.num} cb={cb}/>
        }) }
    </div>
  }
}


class CardSetIcon extends React.Component {
  render() {
    return <div className="container cardset">
        { this.props.cards.map(function(card, i){
          return <CardIcon num={card.num} suit={card.suit}/>
        }) }
    </div>
  }
}


class Footer extends React.Component {
  render() {
    return <div className="footer">
      <h3>&copy; 2017 Jennie Zheng </h3>
      <ul className='fa-ul footer_links'>
        <li><a target="_blank" href="https://www.linkedin.com/in/jenniezheng"><i className="fa-linkedin fa"></i></a></li>
        <li><a target="_blank" href="https://www.facebook.com/jenniezheng2" > <i className="fa-facebook fa"></i></a></li>
        <li><a target="_blank" href="https://github.com/jenniezheng321"><i className="fa-github fa"></i></a></li>
      </ul>
    </div>
  }
}

ReactDOM.render(<Calculator />, document.getElementById('app'));