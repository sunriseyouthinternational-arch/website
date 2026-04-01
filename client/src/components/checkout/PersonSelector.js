import React from 'react';

function PersonSelector({ member, itemData, selectedPersons, setSelectedPersons, selectedCoupons, setSelectedCoupons }) {
  const togglePerson = (personId) => {
    setSelectedPersons(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const cost = itemData.cost || itemData.classInfoId?.cost || 0;

  return (
    <div className="bg-white p-8 rounded-xl shadow-[0_12px_40px_0_rgba(32,28,0,0.06)]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#4b4734] uppercase mb-1">Step 01</p>
          <h3 className="text-3xl font-extrabold tracking-tighter">WHO'S JOINING?</h3>
        </div>
        <button className="bg-[#fff4c0] text-[#201c00] font-bold py-2 px-6 rounded-full text-sm hover:bg-[#ffef92] transition-colors">
          + ADD FAMILY
        </button>
      </div>

      <div className="space-y-4">
        {/* Self */}
        <div
          onClick={() => togglePerson('self')}
          className={`flex items-center justify-between p-6 rounded-lg cursor-pointer border-2 ${
            selectedPersons.includes('self')
              ? 'bg-[#fff4c0] border-[#201c00]'
              : 'bg-white border-[#cdc7ae]/20 hover:border-[#cdc7ae]'
          } transition-colors`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ffe950] flex items-center justify-center font-bold text-[#746800]">
              {getInitials(member.name)}
            </div>
            <div>
              <p className="font-extrabold text-lg">{member.name} (Self)</p>
              <p className="text-sm text-[#4b4734] font-medium">{itemData.name || itemData.classInfoId?.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-xl">${cost.toFixed(2)}</p>
            <button className="text-[10px] font-bold text-[#6a5f00] underline tracking-widest">APPLY COUPON</button>
          </div>
        </div>

        {/* Family Members */}
        {member.familyMembers?.map((fm, index) => (
          <div
            key={index}
            onClick={() => togglePerson(index)}
            className={`flex items-center justify-between p-6 rounded-lg cursor-pointer border-2 ${
              selectedPersons.includes(index)
                ? 'bg-[#fff4c0] border-[#201c00]'
                : 'bg-white border-[#cdc7ae]/20 hover:border-[#cdc7ae]'
            } transition-colors`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#e2dfde] flex items-center justify-center font-bold text-[#636262]">
                {getInitials(fm.name)}
              </div>
              <div>
                <p className="font-extrabold text-lg">{fm.name} (Family)</p>
                <p className="text-sm text-[#4b4734] font-medium">{itemData.name || itemData.classInfoId?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-xl">${cost.toFixed(2)}</p>
              <button className="text-[10px] font-bold text-[#6a5f00] underline tracking-widest">APPLY COUPON</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonSelector;
