# 🐔 Chicken Egg-Catching Game 🥚

A fun chicken egg-catching game built with Phaser 3 and React. Two AI-controlled chickens compete to catch falling eggs in their respective zones.

## Game Overview

In this game, two chickens (A and B) try to catch eggs falling in their respective zones. The game runs for 30 seconds, and the chicken that catches the most eggs wins!

### Game Features

- Two AI-controlled chickens that move automatically to catch eggs
- Split-screen gameplay with left and right zones
- Randomized egg spawning with varied fall speeds
- Score tracking and round timer
- End-of-round winner announcement
- Automatic round restarts

## How to Play

Just launch the game and watch as the two chickens compete! The game is fully automated and will restart after each 30-second round.

## Technical Implementation

The game is built using:

- **Phaser 3**: For game rendering and physics
- **React**: For UI elements and integration with web
- **TypeScript**: For type-safe code

### Game Architecture

The codebase follows a modular structure:

- `entities/`: Contains Chicken and Egg game objects
- `utils/`: Contains utilities for collision detection and egg spawning
- `scenes/`: Contains the main ChickenGame scene
- React components for UI integration

## Future Enhancements

Potential improvements for future versions:

- Add sound effects for egg catching and round completion
- Implement more sophisticated AI behaviors
- Add player-controlled mode
- Create a prediction system where users can bet on which chicken will win
