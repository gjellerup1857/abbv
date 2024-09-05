Testing commands: 

From the root: 
npm run test --workspaces --if-present
npm run -w=host/adblock check-feature-flags

Questions: 
- Can we update stuff and see it immediately from the host perspective? (Currently no. Need to figure that out.)
- What do we name things? @core is clearly not the play here. 
- What meta do we want to add around these core utilities? Some might only be usable in some contexts (browser vs node)
- What does running this in terms of our gitlab pipelines look like? 
