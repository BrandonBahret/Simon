
function Simon(){
  
  function Tile(id, audioURL){
    var tileId = "#tile-" + id;
    var sound = new Audio(audioURL);
    
    sound.playbackRate = 1.75;
    sound.preload = "auto";

    this.activate = function(delay){
      this.deactivate();
      $(tileId).addClass("active-tile");
      sound.play();
      
      setTimeout(function(){
        $(tileId).removeClass("active-tile");
      }, delay);
    }
    
    this.deactivate = function(){
      sound.pause();
      $(tileId).removeClass("active-tile");
    }
    
    this.changePlaybackRate = function(rate){
      sound.playbackRate = rate;
    }
  }
  
  this.tiles = [
    new Tile(1, "https://s3.amazonaws.com/freecodecamp/simonSound1.mp3"),
    new Tile(2, "https://s3.amazonaws.com/freecodecamp/simonSound2.mp3"),
    new Tile(3, "https://s3.amazonaws.com/freecodecamp/simonSound3.mp3"),
    new Tile(4, "https://s3.amazonaws.com/freecodecamp/simonSound4.mp3")
  ];
  
  var failSound = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound4.mp3");
  failSound.playbackRate = 0.5;
  
  this.isOn = false;
  this.isGameActive = false;
  this.tilesLocked = false;
  this.currentGameStreak = 0;
  this.lastTimeTileClicked = -1;
  this.isStrict = false;
  this.count = 1;
  this.sequence = [];
  this.sequenceHandle = -1;
  var sequenceRepeatIntervalHandle = -1;
  var timeLimit = 5000;
  
  
  this.changeTilesPlaybackRate = function(rate){
    this.tiles.forEach(function(tile){
      tile.changePlaybackRate(rate);
    });    
  }

  this.deactivateTiles = function(){
    this.tiles.forEach(function(tile){
      tile.deactivate();
    });
  }
  
  this.toggleStrict = function(){
    if(this.isOn){
      this.isStrict = !this.isStrict;
      $("#strict-indicator").toggleClass("on");
    }
  }

  this.setPowerState = function(isOn) {
    this.isOn = isOn;
    if(!this.isOn){
      this.reset();
      $("#strict-indicator").removeClass("on");
    }
  }
  
  this.reset = function(){
    this.deactivateTiles();
    this.isOn = false;
    this.isStrict = false;
    this.isGameActive = false;
    this.updateCountDisplay(-1);
    clearInterval(sequenceRepeatIntervalHandle);
  }
  
  this.updateCountDisplay = function(value){
    if(value == -1) value = "--";
    $(".counter-display").html(value);
  }
  
  this.generateSequence = function(sequence){
    var sequence = [];
    for(var step = 0; step < 20; step++){
      sequence.push(Math.floor(Math.random() * 4));
    }
    return sequence;
  }
  
  
  this.playSequence = function(sequence, maxStep, activeTime, inactiveTime, callback){
    if(this.sequenceHandle !== -1){
      clearInterval(this.sequenceHandle);
      this.sequenceHandle = -1;      
    }

    if(this.isGameActive){
      var index = 0;
      var game = this;
      this.sequenceHandle = setInterval(function(){
        if(index >= maxStep){
          clearInterval(game.sequenceHandle);
          game.sequenceHandle = -1;
          if(callback !== undefined) callback();
        }
        else{
          if(game.isGameActive){
            var tileIndex = sequence[index++];
            game.tiles[tileIndex].activate(activeTime);
          }
        }
      }, inactiveTime);
    }
  }
  this.playGameSequence = function(callback){
    if(this.count < 5){
      this.playSequence(this.sequence, this.count, 500, 650, callback);
      this.changeTilesPlaybackRate(1);
    }
    if(this.count >= 5){
      this.playSequence(this.sequence, this.count, 450, 600, callback);
      this.changeTilesPlaybackRate(1.25);
    }
    else if(this.count >= 9){
      this.playSequence(this.sequence, this.count, 400, 550, callback);
      this.changeTilesPlaybackRate(1.50);
    }
    else if(this.count >= 13){
      this.playSequence(this.sequence, this.count, 350, 500, callback);
      this.changeTilesPlaybackRate(1.75);
    }
  }
  
  this.startGame = function(){
    if(this.isOn){
      this.deactivateTiles();
      this.count = 1;
      this.isGameActive = true;
      this.tilesLocked = false;
      this.sequence = this.generateSequence();
      this.updateCountDisplay(this.count);
      
      clearInterval(sequenceRepeatIntervalHandle);
      var game = this;
      this.playGameSequence(function(){
        sequenceRepeatIntervalHandle = setInterval(function(){
          game.failure();
        }, timeLimit);
      });
    }
  }

  this.tileClicked = function(tileId){
    if(this.isOn && !this.tilesLocked && this.isGameActive && this.sequenceHandle === -1){

      //       this.lastTimeTileClicked = Math.floor(Date.now() / 1000);
      var game = this;
      clearInterval(sequenceRepeatIntervalHandle);
      sequenceRepeatIntervalHandle = setInterval(function(){
        game.failure();
      }, timeLimit);
      
      this.tilesLocked = true;
      setTimeout(function(){
        game.tilesLocked = false;
      }, 100);

      var delay = 300;
      this.tiles[tileId - 1].activate(delay, true);
      setTimeout(function(){
        game.checkSequence(tileId - 1);
      }, delay);
    }
  }
  
  this.playVictorySequence = function(){
    var winSeq = [0,1,3,2,0,1,3,2,0,3,1,2,0,3,1,2];
    this.changeTilesPlaybackRate(3);
    this.playSequence(winSeq, winSeq.length, 300, 400, true);
    $(".counter-display").html("win");
    clearInterval(sequenceRepeatIntervalHandle);
    
    var game = this;
    setTimeout(function(){
      // Ran after the win sequence is over
      $(".counter-display").html("--");
      game.changeTilesPlaybackRate(1.75);
    }, 7000);
  }
  
  this.failure = function(){
    failSound.play();
    this.currentGameStreak = 0;
    this.tilesLocked = true;

    var game = this;
    if(this.isStrict){
      clearInterval(sequenceRepeatIntervalHandle);
      this.isGameActive = false;
      setTimeout(function(){
        game.updateCountDisplay(-1);
      }, 500)
    }
    else{
      clearInterval(sequenceRepeatIntervalHandle);
      setTimeout(function(){
        game.playGameSequence(function(){
          sequenceRepeatIntervalHandle = setInterval(function(){
            game.failure();
          }, timeLimit);
        });
        game.tilesLocked = false;
      }, 750);      
    }
  }
  
  this.checkSequence = function(tileIndex){
    if(tileIndex === this.sequence[this.currentGameStreak]){
      this.currentGameStreak += 1
      if(this.currentGameStreak === this.count){
        this.currentGameStreak = 0;
        this.updateCountDisplay(++this.count);
        
        clearInterval(sequenceRepeatIntervalHandle);
        var game = this;
        game.playGameSequence(function(){
          sequenceRepeatIntervalHandle = setInterval(function(){
            game.failure();
          }, timeLimit);
        });
        
        if(this.count === 20){
          this.playVictorySequence();
        }
      }
    }
    else this.failure();
  }
  
}

var game = new Simon();

$(document).ready(function(){
  
  var isOn = $("#power-switch-input").is(":checked");
  game.setPowerState(isOn);
  
  $(".tile").on("click", function(){
    var tileId = parseInt(this.id[5]);
    game.tileClicked(tileId);
  });
  
  $("#start-button").on("click", function(){
    game.startGame();
  });

  $("#strict-button").on("click", function(){
    game.toggleStrict();
  });
  
  $("#power-switch").on("click", function(){
    var isOn = $("#power-switch-input").is(':checked');
    game.setPowerState(isOn);
  });

});